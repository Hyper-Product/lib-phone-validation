'use strict';

const parser = require('./dist/index').phone;

const geo = 'SE';
const geoCode = '46';
const number = '460737403598';
const result = parser(number, {
	country: geo,
	validateMobilePrefix: false,
	customCountryPhoneData: [{
		"alpha2": "SE",
		"alpha3": "SWE",
		"country_code": "46",
		"country_name": "Sweden",
		"mobile_begin_with": [
			"7"
		],
		"phone_number_lengths": [
			8,
			9,
			10,
			11,
			12,
			13
		]
	}]
});

// eslint-disable-next-line no-console
console.log(result);
console.log(number.startsWith(geoCode));
