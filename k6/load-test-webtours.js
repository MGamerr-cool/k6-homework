import http from "k6/http";
import { parseHTML } from 'k6/html';
import { check, group } from "k6";
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

const csvDataUsers = new SharedArray('users log/pas', function () {
  // Load CSV file and parse it using Papa Parse
  return papaparse.parse(open('./users.csv'), { header: true }).data;
});

const csvDataCities = new SharedArray('cities depart', function () {
  // Load CSV file and parse it using Papa Parse
  return papaparse.parse(open('./cities.csv'), { header: true }).data;
});

const csvDataCities2 = new SharedArray('cities arrive', function () {
  // Load CSV file and parse it using Papa Parse
  return papaparse.parse(open('./cities2.csv'), { header: true }).data;
});

export default function () {
  // Pick a random username/password and cities
  const randomUser = csvDataUsers[Math.floor(Math.random() * csvDataUsers.length)];
  const city_depart = csvDataCities[Math.floor(Math.random() * csvDataCities.length)].city_depart;
  const city_arrive = csvDataCities2[Math.floor(Math.random() * csvDataCities2.length)].city_arrive;
  //console.log('Random randomUser: ', JSON.stringify(randomUser));
  //console.log('Random city_depart: ', JSON.stringify(city_depart));
  //console.log('Random city_arrive: ', JSON.stringify(city_arrive));

  const params = {
    login: randomUser.username,
    password: randomUser.password,
  };
  //console.log('Random user params: ', JSON.stringify(params));


  let goToWebtours = http.get("http://webtours.load-test.ru:1090/webtours/")
  check(goToWebtours, {
    "status code goToWebtours is 200": (goToWebtours) => goToWebtours.status == 200,
  });

  let goToWebtours_Welcome = http.get("http://webtours.load-test.ru:1090/cgi-bin/welcome.pl?signOff=true")
  check(goToWebtours_Welcome, {
    "status code goToWebtours_Welcome is 200": (goToWebtours_Welcome) => goToWebtours_Welcome.status == 200,
  });

  let goToWebtours_Nav = http.get("http://webtours.load-test.ru:1090/cgi-bin/nav.pl?in=home")
  check(goToWebtours_Nav, {
    "status code goToWebtours_Nav is 200": (goToWebtours_Nav) => goToWebtours_Nav.status == 200,
  });
  let doc = parseHTML(goToWebtours_Nav.body);
  let userSession = doc.find('input').attr('value');
  console.log('userSessionParsed: ', JSON.stringify(userSession));


  let loginPost = http.post("http://webtours.load-test.ru:1090/cgi-bin/login.pl", {
    'userSession': `${userSession}`,
    'username': `${params.login}`,
    'password': `${params.password}`,
    'login.x': '69',
    'login.y': '4',
    'JSFormSubmit': 'off',
  },
  { Headers: { 'Cont-Type': 'application/json' } })
  check(loginPost, {
    "status code loginPost is 200": (loginPost) => loginPost.status == 200,
  });

  let login_Nav = http.get("http://webtours.load-test.ru:1090/cgi-bin/nav.pl?page=menu&in=home")
  check(login_Nav, {
    "status code login_Nav is 200": (login_Nav) => login_Nav.status == 200,
  });

  let loginGet = http.get("http://webtours.load-test.ru:1090/cgi-bin/login.pl?intro=true")
  check(loginGet, {
    "status code loginGet is 200": (loginGet) => loginGet.status == 200,
  });


  let goToFlight = http.get("http://webtours.load-test.ru:1090/cgi-bin/welcome.pl?page=search")
  check(goToFlight, {
    "status code goToFlight is 200": (goToFlight) => goToFlight.status == 200,
  });

  let goToFlight_Nav = http.get("http://webtours.load-test.ru:1090/cgi-bin/nav.pl?page=menu&in=flights")
  check(goToFlight_Nav, {
    "status code goToFlight_Nav is 200": (goToFlight_Nav) => goToFlight_Nav.status == 200,
  });

  let goToFlight_Reservations = http.get("http://webtours.load-test.ru:1090/cgi-bin/reservations.pl?page=welcome")
  check(goToFlight_Reservations, {
    "status code goToFlight_Reservations is 200": (goToFlight_Reservations) => goToFlight_Reservations.status == 200,
  });
  let doc2 = parseHTML(goToFlight_Reservations.body);
  let departDate = doc2.find('body blockquote form table tr td input').attr('value');
  let returnDate = doc2.find('body blockquote form table tr').next().find('input').attr('value');
  //console.log('departDate: ', JSON.stringify(departDate));
  //console.log('returnDate: ', JSON.stringify(returnDate));

  console.log('------------------------------');
  console.log('city_depart', city_depart);
  console.log('departDate', departDate);
  console.log('city_arrive', city_arrive);
  console.log('returnDate', returnDate);
  console.log('------------------------------');

  //console.log('BuyTicketStep1Data', JSON.stringify(BuyTicketStep1Data));

  let BuyTicketStep1 = http.post("http://webtours.load-test.ru:1090/cgi-bin/reservations.pl", {
    "advanceDiscount": "0",
    "depart": city_depart,
    "departDate": departDate,
    "arrive": city_arrive,
    "returnDate": returnDate,
    "numPassengers": "1",
    "seatPref": "None",
    "seatType": "Coach",
    "findFlights.x": "47",
    "findFlights.y": "14",
    ".cgifields": "roundtrip",
    ".cgifields": "seatType",
    ".cgifields": "seatPref"
  },
    { Headers: { 'Cont-Type': 'application/json' } });
  check(BuyTicketStep1, {
    "status code BuyTicketStep1 is 200": (BuyTicketStep1) => BuyTicketStep1.status == 200,
  });

  let doc3 = parseHTML(BuyTicketStep1.body);
  let outboundFlight = doc3.find('input[checked="checked"]').val();
  console.log("outboundFlight: ", JSON.stringify(outboundFlight));
  //console.log("choose_flight", JSON.stringify(BuyTicketStep1));

  let BuyTicketStep2 = http.post("http://webtours.load-test.ru:1090/cgi-bin/reservations.pl", {
    "outboundFlight": outboundFlight,
    "numPassengers": "1",
    "advanceDiscount": "0",
    "seatPref": "None",
    "seatType": "Coach",
    "reserveFlights.x": "50",
    "reserveFlights.y": "10",
  },
    { Headers: { 'Cont-Type': 'application/json' } });
  check(BuyTicketStep2, {
    "status code BuyTicketStep2 is 200": (BuyTicketStep2) => BuyTicketStep2.status == 200,
  });

  let BuyTicketStep3 = http.post("http://webtours.load-test.ru:1090/cgi-bin/reservations.pl", {
    "firstName": params.password,
    "lastName": params.login,
    "address1": "street",
    "address2": "city",
    "pass1": params.password + params.login,
    "creditCard": "",
    "expDate": "",
    "oldCCOption": "",
    "numPassengers": "1",
    "seatType": "Coach",
    "seatPref": "None",
    "outboundFlight": outboundFlight,
    "advanceDiscount": "0",
    "returnFlight": "",
    "JSFormSubmit": "off",
    "buyFlights.x": "60",
    "buyFlights.y": "5",
    ".cgifields": "saveCC",
  },
    { Headers: { 'Cont-Type': 'application/json' } });
  check(BuyTicketStep3, {
    "status code BuyTicketStep3 is 200": (BuyTicketStep3) => BuyTicketStep3.status == 200,
  });

  let goToHome = http.get("http://webtours.load-test.ru:1090/cgi-bin/welcome.pl?page=menus")
  check(goToHome, {
    "status code goToHome is 200": (goToHome) => goToHome.status == 200,
  });

}