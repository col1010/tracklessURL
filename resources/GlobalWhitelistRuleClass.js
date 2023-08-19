import { getStoredRuleList } from "../scripts/utils.js";
import whitelistRuleTemplate from "../resources/whitelist-rule-template.js";

export class GlobalWhitelistRule {

    /**
     * 
     * @param {string} domain The domain to globally whitelist
     */
    constructor(domain) {
        this.domain = domain;
    }

    /**
     * Returns a JSON object representing a DNR rule that whitelists a specific domain
     *
     * @returns {Promise} A Promise resolving to a JSON object representing the DNR rule
     */
    getRuleJson() {
        return new Promise(async (resolve) => {
            let template = JSON.parse(JSON.stringify(whitelistRuleTemplate));
            const nextAvailableId = await this.getNextAvailableId();
            template.id = nextAvailableId;
            template.condition.requestDomains.push(this.domain);
            resolve(template);
        })
    }

    /**
     * Returns the next available DNR rule ID
     * 
     * @returns {Promise} The next available DNR rule ID
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