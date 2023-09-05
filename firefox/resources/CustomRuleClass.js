import { getStoredRuleList } from "../scripts/utils.js";
import ruleTemplate from "../resources/rule-template.js";

export class CustomRule {

    domainArr = [];

    /**
     * @param {string} parameter A URL parameter
     * @param {string} group The group the rule belongs to. "" if no group
     * @param {string} domainFilterListType The type of filter. Either "Blacklist" or "Whitelist"
     * @param {string} domainFilterList A comma-separated list of domains to either blacklist or whitelist
     */
    constructor(parameter, group, domainFilterListType, domainFilterList) {
        this.parameter = parameter;
        this.group = group;
        this.domainFilterListType = domainFilterListType;
        this.domainFilterList = domainFilterList;
        if (this.domainFilterList !== '') {
            this.domainArr = domainFilterList.split(',').map(domain => domain.trim());
        } else {
            this.domainArr = [];
        }
    }

    /**
     * Returns a JSON object representing a DNR rule
     *
     * @returns {Promise} A Promise resolving to JSON object representing a DNR rule
     */
    getRuleJson() {
        return new Promise(async (resolve) => {
            let template = JSON.parse(JSON.stringify(ruleTemplate));
            const nextAvailableId = await this.getNextAvailableId();
            template.id = nextAvailableId;
            template.action.redirect.transform.queryTransform.removeParams = [this.parameter];
            template.condition.regexFilter = `[?&]${this.parameter}=*`;
            if (this.domainFilterList !== '') {
                if (this.domainFilterListType === 'Whitelist' && this.domainArr.length > 0) {
                    template.condition.excludedRequestDomains = this.domainArr;
                } else { // Blacklist
                    template.condition.requestDomains = this.domainArr;
                }
            }
            resolve(template);
        });
    }

    /**
     * Returns whether domainList is a valid list of domains
     * 
     * @param {string[]} domainList The array of domains to validate
     * @returns {boolean} Whether the entire domain list is valid
     */
    static validateDomains(domainList) {
        if (domainList === "") {
            return true;
        }

        const domains = domainList.split(',').map(domain => domain.trim());

        const allDomainsValid = domains.every(domain => {
            if (this.isValidDomain(domain)) {
                return true;
            } else {
                return false;
            }
        })
        return allDomainsValid;
    }

    /**
     * Returns whether domain is valid
     * 
     * @param {string} domain The domain to test
     * @returns {boolean} Whether the domain is valid
     */
    static isValidDomain(domain) {
        const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return domainRegex.test(domain);
    }

    /**
     * Returns whether param is valid
     * 
     * @param {string} param The URL parameter to test
     * @returns {boolean} Whether the URL parameter is valid
     */
    static isValidParameter(param) {
        const paramRegex = /^[a-zA-Z0-9-_]{1,}$/;
        return paramRegex.test(param);
    }

    /**
     * Returns whether a group name is valid
     * 
     * @param {string} groupName The group name to test
     * @returns {boolean} Whether the group name is valid
     */
    static isValidGroup(groupName) {
        const groupRegex = /^[a-zA-Z0-9-_\. ]{0,}$/;
        return groupRegex.test(groupName);
    }

    /**
     * Returns the next available DNR rule ID
     * 
     * @returns {Promise} A Promise representing the next available DNR rule ID
     */
    getNextAvailableId() {
        return new Promise((resolve, reject) => {
            getStoredRuleList()
                .then((ruleList => {

                    if (ruleList.length === 0) { resolve(1); }
                    const IdArr = ruleList.map((rule) => { return rule.id });
                    IdArr.sort((a, b) => a - b);
                    let nextAvailableId = 1;
                    for (const id of IdArr) {
                        if (id === nextAvailableId) {
                            nextAvailableId++;
                        } else {
                            break;
                        }
                    }
                    console.log("Next available ID: ", nextAvailableId);
                    resolve(nextAvailableId);
                }))
                .catch((err => {
                    console.error(err);
                    reject(new Error(err));
                }));
        });
    }
}

// export {CustomRule};