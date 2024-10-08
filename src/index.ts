import countryPhoneData from './data/country_phone_data';
import {
	findCountryPhoneDataByCountry,
	findCountryPhoneDataByPhoneNumber,
	validatePhoneISO3166,
	CountryPhoneDataItem,
} from './lib/utility';

export interface PhoneInvalidResult {
	isValid: false;
	phoneNumber: null;
	countryIso2: null;
	countryIso3: null;
	countryCode: null;
}
  
export interface PhoneValidResult {
	isValid: true;
	phoneNumber: string;
	countryIso2: string;
	countryIso3: string;
	countryCode: string;
}
  
export type PhoneResult = PhoneInvalidResult | PhoneValidResult; 

/**
 * @typedef {Object} Option
 * @property {string=} country - country code in ISO3166 alpha 2 or 3
 * @property {boolean=} validateMobilePrefix - true to validate phone number prefix
 * @property {boolean=} strictDetection - true to disable remove truck code and detection logic
 *
 * @param {string} phoneNumber - phone number
 * @param {Option} option
 * @returns {{phoneNumber: string|null, countryIso2: string|null, countryIso3: string|null}}
 */
export default function phone(phoneNumber: string, {
	country = '',
	validateMobilePrefix = true,
	strictDetection = false,
	customCountryPhoneData = undefined,
}: {
	country?: string;
	validateMobilePrefix?: boolean;
	strictDetection?: boolean;
	customCountryPhoneData?: CountryPhoneDataItem[];
} = {}): PhoneResult {
	const invalidResult = {
		isValid: false as const,
		phoneNumber: null,
		countryIso2: null,
		countryIso3: null,
		countryCode: null
	};

	let processedPhoneNumber = (typeof phoneNumber !== 'string') ? '' : phoneNumber.trim();
	const processedCountry = (typeof country !== 'string') ? '' : country.trim();
	const hasPlusSign = Boolean(processedPhoneNumber.match(/^\+/));

	// remove any non-digit character, included the +
	processedPhoneNumber = processedPhoneNumber.replace(/\D/g, '');

	let foundCountryPhoneData = findCountryPhoneDataByCountry(processedCountry, customCountryPhoneData);

	if (!foundCountryPhoneData) {
		return invalidResult;
	}

	let defaultCountry = false;

	// if country provided, only reformat the phone number
	if (processedCountry) {
		// if input 89234567890, RUS, remove the 8
		if (foundCountryPhoneData.alpha3 === 'RUS' && processedPhoneNumber.length === 11 && processedPhoneNumber.match(/^89/) !== null) {
			processedPhoneNumber = processedPhoneNumber.replace(/^8+/, '');
		}

		// if there's no plus sign and the phone number does not start with country code
		// then assume there's no country code, hence add back the country code
		if (!hasPlusSign && !processedPhoneNumber.startsWith(foundCountryPhoneData.country_code)) {
			processedPhoneNumber = `${foundCountryPhoneData.country_code}${processedPhoneNumber}`;
		}
	} else if (hasPlusSign) {
		// if there is a plus sign but no country provided
		// try to find the country phone data by the phone number
		const { exactCountryPhoneData, possibleCountryPhoneData } = findCountryPhoneDataByPhoneNumber(processedPhoneNumber, validateMobilePrefix, customCountryPhoneData);

		if (exactCountryPhoneData) {
			foundCountryPhoneData = exactCountryPhoneData;
		} else if (possibleCountryPhoneData && !strictDetection) {
			// for some countries, the phone number usually includes one trunk prefix for local use
			// The UK mobile phone number ‘07911 123456’ in international format is ‘+44 7911 123456’, so without the first zero.
			// 8 (AAA) BBB-BB-BB, 0AA-BBBBBBB
			// the numbers should be omitted in international calls

			foundCountryPhoneData = possibleCountryPhoneData;
			processedPhoneNumber = foundCountryPhoneData.country_code + processedPhoneNumber.replace(new RegExp(`^${foundCountryPhoneData.country_code}\\d`), '');
		} else {
			foundCountryPhoneData = null;
		}
	} else if (foundCountryPhoneData.phone_number_lengths.indexOf(processedPhoneNumber.length) !== -1) {
		// B: no country, no plus sign --> treat it as USA
		// 1. check length if == 11, or 10, if 10, add +1, then go go D
		// no plus sign, no country is given. then it must be USA
		// iso3166 = iso3166_data[0]; already assign by the default value
		processedPhoneNumber = `1${processedPhoneNumber}`;
		defaultCountry = true;
	}

	if (!foundCountryPhoneData) {
		return invalidResult;
	}

	// remove leading 0s for all countries except 'CIV', 'COG'
	if (!['CIV', 'COG'].includes(foundCountryPhoneData.alpha3)) {
		const phoneNumberWithoutCode = replaceCode(processedPhoneNumber.replace('+', ''), foundCountryPhoneData.country_code);
		const phoneNumberWithoutLeadingZero = phoneNumberWithoutCode.replace(/^0+/, '');
		processedPhoneNumber = `${foundCountryPhoneData.country_code}${phoneNumberWithoutLeadingZero}`;
	}

	let validateResult = validatePhoneISO3166(processedPhoneNumber, foundCountryPhoneData, validateMobilePrefix, hasPlusSign);

	if (validateResult) {
		return {
			isValid: true as const,
			phoneNumber: `+${processedPhoneNumber}`,
			countryIso2: foundCountryPhoneData.alpha2,
			countryIso3: foundCountryPhoneData.alpha3,
			countryCode: `+${foundCountryPhoneData.country_code}`
		};
	}

	if (defaultCountry) {
		// also try to validate against CAN for default country, as CAN is also start with +1
		foundCountryPhoneData = findCountryPhoneDataByCountry('CAN', customCountryPhoneData) as CountryPhoneDataItem;
		validateResult = validatePhoneISO3166(processedPhoneNumber, foundCountryPhoneData, validateMobilePrefix, hasPlusSign);
		if (validateResult) {
			return {
				isValid: true as const,
				phoneNumber: `+${processedPhoneNumber}`,
				countryIso2: foundCountryPhoneData.alpha2,
				countryIso3: foundCountryPhoneData.alpha3,
				countryCode: `+${foundCountryPhoneData.country_code}`
			};
		}
	}

	return invalidResult;
};

function replaceCode(phone: string, code: string): string {
	const index = phone.indexOf(code);

	if (index !== -1) { // If "33" is found
		return  phone.substring(0, index) + phone.substring(index + code.length);
	}

	return phone;
}

export {
	phone,
	countryPhoneData,
};
