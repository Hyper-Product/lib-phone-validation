'use strict';

const parser = require('./dist/index').phone;

const geo = 'FR';
const number = '123456725';
const result = parser(number, {
	country: geo,
	validateMobilePrefix: false,
	customCountryPhoneData: [{
		alpha2: 'FR',
		alpha3: 'FRA',
		country_code: '33',
		country_name: 'France',
		mobile_begin_with: ['6', '7'],
		phone_number_lengths: [9]
	}]
});

// eslint-disable-next-line no-console
console.log(result);
