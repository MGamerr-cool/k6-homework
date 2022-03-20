import http from 'k6/http';
import { check, group } from 'k6';

export let options = {
    discardResponseBodies: true,
    scenarios: {
        yandex: {
            executor: 'ramping-arrival-rate',
            exec: "ya",
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: 5,
            maxVUs: 25,
            stages: [
                { target: 60, duration: '300s' },
                { target: 60, duration: '600s' },
                { target: 72, duration: '300s' },
                { target: 72, duration: '600s' },
            ],
        },
        www: {
            executor: 'ramping-arrival-rate',
            exec: "www",
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: 10,
            maxVUs: 50,
            stages: [
                { target: 120, duration: '300s' },
                { target: 120, duration: '600s' },
                { target: 144, duration: '300s' },
                { target: 144, duration: '600s' },
            ],
        },
    },
};

export function ya() {
    group('ya.ru', function () {
        let yaru = http.get("https://ya.ru/")
    })
}

export function www() {
    group('www.ru', function () {
        let www = http.get("http://www.ru/")
    })
}