"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.countryPhoneData = exports.phone = void 0;
const country_phone_data_1 = __importDefault(require("./data/country_phone_data"));
exports.countryPhoneData = country_phone_data_1.default;
const utility_1 = require("./lib/utility");
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
function phone(phoneNumber, { country = '', validateMobilePrefix = true, strictDetection = false, customCountryPhoneData = undefined, } = {}) {
    const invalidResult = {
        isValid: false,
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
    let foundCountryPhoneData = (0, utility_1.findCountryPhoneDataByCountry)(processedCountry, customCountryPhoneData);
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
    }
    else if (hasPlusSign) {
        // if there is a plus sign but no country provided
        // try to find the country phone data by the phone number
        const { exactCountryPhoneData, possibleCountryPhoneData } = (0, utility_1.findCountryPhoneDataByPhoneNumber)(processedPhoneNumber, validateMobilePrefix, customCountryPhoneData);
        if (exactCountryPhoneData) {
            foundCountryPhoneData = exactCountryPhoneData;
        }
        else if (possibleCountryPhoneData && !strictDetection) {
            // for some countries, the phone number usually includes one trunk prefix for local use
            // The UK mobile phone number ‘07911 123456’ in international format is ‘+44 7911 123456’, so without the first zero.
            // 8 (AAA) BBB-BB-BB, 0AA-BBBBBBB
            // the numbers should be omitted in international calls
            foundCountryPhoneData = possibleCountryPhoneData;
            processedPhoneNumber = foundCountryPhoneData.country_code + processedPhoneNumber.replace(new RegExp(`^${foundCountryPhoneData.country_code}\\d`), '');
        }
        else {
            foundCountryPhoneData = null;
        }
    }
    else if (foundCountryPhoneData.phone_number_lengths.indexOf(processedPhoneNumber.length) !== -1) {
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
    let validateResult = (0, utility_1.validatePhoneISO3166)(processedPhoneNumber, foundCountryPhoneData, validateMobilePrefix, hasPlusSign);
    if (validateResult) {
        return {
            isValid: true,
            phoneNumber: `+${processedPhoneNumber}`,
            countryIso2: foundCountryPhoneData.alpha2,
            countryIso3: foundCountryPhoneData.alpha3,
            countryCode: `+${foundCountryPhoneData.country_code}`
        };
    }
    if (defaultCountry) {
        // also try to validate against CAN for default country, as CAN is also start with +1
        foundCountryPhoneData = (0, utility_1.findCountryPhoneDataByCountry)('CAN', customCountryPhoneData);
        validateResult = (0, utility_1.validatePhoneISO3166)(processedPhoneNumber, foundCountryPhoneData, validateMobilePrefix, hasPlusSign);
        if (validateResult) {
            return {
                isValid: true,
                phoneNumber: `+${processedPhoneNumber}`,
                countryIso2: foundCountryPhoneData.alpha2,
                countryIso3: foundCountryPhoneData.alpha3,
                countryCode: `+${foundCountryPhoneData.country_code}`
            };
        }
    }
    return invalidResult;
}
exports.default = phone;
exports.phone = phone;
;
function replaceCode(phone, code) {
    const index = phone.indexOf(code);
    if (index !== -1) { // If "33" is found
        return phone.substring(0, index) + phone.substring(index + code.length);
    }
    return phone;
}
