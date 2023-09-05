import { CustomRule } from "../resources/CustomRuleClass.js";
import { GlobalWhitelistRule } from "../resources/GlobalWhitelistRuleClass.js";
import * as utils from "./utils.js";
import * as uiBuilder from "./ui-builder.js";

// Add Rule Functions


/**
 * Initiates the process of adding a new rule to the browser
 * 
 * @param {Event} event the event fired when the addRuleForm form is submitted
 * 
 */
export function handleAddRule(event) {

    const formData = new FormData(event.target);

    const parameter = formData.get('parameter');
    const group = formData.get('group');
    const domainFilterType = formData.get('domainFilterType');
    const domainFilterList = formData.get('domainFilterList');

    let newRule = new CustomRule(parameter, group, domainFilterType, domainFilterList)

    processAddRule(newRule);
}

/**
 * Handles checking for duplicate rules and calling the functions necessary to
 * add rules to the browser and refresh the UI
 * In the case of defaultRule being true, UI operations are skipped, as these calls
 * will be made from the service worker
 * 
 * @param {CustomRule} newRule The new rule to be added to the browser
 * @param {boolean} defaultRule Whether the rule to be added is a default rule
 */
export function processAddRule(newRule, defaultRule = false) {
    return new Promise((resolve) => {
        // console.log("processAddRule(): Rule submitted: ", newRule);

        utils.checkForDuplicateRule(newRule)
            .then(async (rule) => {
                if (rule) {
                    // duplicate found
                    if (!defaultRule) {
                        console.error(`Rule with parameter "${newRule.parameter}" already exists!`);
                        utils.showBottomAlert(`Rule with parameter "${newRule.parameter}" already exists!`, "warning");
                    }
                    resolve();
                } else {
                    const newRuleJson = await newRule.getRuleJson();
                    // console.log("processAddRule(): Rule JSON to be added: ", newRuleJson);
                    addRule(newRuleJson, true, newRule.group)
                        .then(() => {
                            // console.log("processAddRule(): Rule added successfully!");
                            if (!defaultRule) {
                                if (newRule.group.length) {
                                    utils.showBottomAlert(`Rule added successfully to group "${newRule.group}"!`, "success");
                                } else {
                                    utils.showBottomAlert("Rule added successfully!", "success");
                                }
                                uiBuilder.refreshRuleLists();
                            }
                            resolve();
                        })
                        .catch((err) => {
                            console.error(err);
                            if (!defaultRule) {
                                utils.showBottomAlert("Error adding rule: " + err, "danger");
                            }
                        });
                }
            })
            .catch((err) => {
                console.error(err);
                if (!defaultRule) {
                    utils.showBottomAlert("Error adding rule: " + err, "danger");
                }
            });
    });

}

/**
 * Calls the two functions that add a rule to the browser dynamic rule list and the locally-stored rule list
 * 
 * @param {chrome.declarativeNetRequest.Rule} newRuleJson The JSON object representing the new rule to add
 * @param {boolean} enabled Whether the rule will be enabled or disabled upon addition. True if adding a brand new rule, false if editing an existing disabled rule
 * @param {string} group The name of the group to add the rule to, "" if no group
 * 
 * @returns {Promise} A void promise
 */
export function addRule(newRuleJson, enabled, group) {
    return new Promise((resolve, reject) => {

        addRuleToBrowserDynamicRuleList(newRuleJson, enabled)
            .then(() => {
                addRuleToLocalStorage(newRuleJson, enabled, group)
                    .then(() => {
                        // console.log("addRule(): Rule added to dynamic rule list and local storage successfully!");
                        resolve();
                    })
                    .catch((err) => {
                        console.error("Adding to local storage failed... removing the rule from the browser dynamic rule list");
                        deleteRule(newRuleJson.id);
                        reject(new Error("Error adding rule to local storage:" + err));
                    })
            })
            .catch((err) => {
                reject(new Error(err));
            })
    })
}

/**
 * Adds a rule to the locally-stored rule list. Adds the "enabled" field as well as the optional "group" field to the rule object
 * 
 * @param {chrome.declarativeNetRequest.Rule} newRuleJson The JSON object representing the new rule to add
 * @param {boolean} enabled Whether the rule will be enabled or disabled upon addition. True if adding a brand new rule, false if editing an existing disabled rule
 * @param {string} group The name of the group to add the rule to, "" if no group
 * @returns {Promise} A void promise
 */
export function addRuleToLocalStorage(newRuleJson, enabled, group) {
    return new Promise((resolve, reject) => {
        utils.getStoredRuleList().then((result) => {
            const rules = result;
            newRuleJson.enabled = enabled;
            if (group !== "") {
                newRuleJson.group = group;
            }
            rules.push(newRuleJson)

            chrome.storage.local.set({ rules: rules })
                .then(() => {
                    // console.log("addRuleToLocalStorage(): Rule added to local storage successfully!");
                    // console.log("addRuleToLocalStorage(): New local storage rule list:", rules);
                    resolve();
                })
                .catch((err) => {
                    reject(new Error("Error saving rule to browser storage:" + err));
                })
        })
            .catch((err) => {
                reject(new Error("Error fetching rules from browser storage:" + err));
            });
    })
}

/**
 * Adds a rule to the browser dynamic rule list
 * 
 * @param {chrome.declarativeNetRequest.Rule} newRuleJson The JSON object representing the new rule to add
 * @param {boolean} enabled Whether the rule will be enabled or disabled upon addition. True if adding a brand new rule, false if editing an existing disabled rule
 * @returns {Promise} A void promise
 */
export function addRuleToBrowserDynamicRuleList(newRuleJson, enabled) {
    return new Promise((resolve, reject) => {
        const newRuleCopy = JSON.parse(JSON.stringify(newRuleJson));

        // Immediately return if the rule is disabled (when a user edits a disabled rule)
        if (!enabled) {
            // console.log("Skipping adding rule to browser dynamic rule list, rule is disabled");
            resolve();
        } else {
            delete newRuleCopy.enabled;
            if (newRuleCopy.group) {
                delete newRuleCopy.group;
            }

            utils.getDynamicRules()
                .then((dynamicRules) => {
                    const numDynamicRules = dynamicRules.length;
                    if (numDynamicRules < chrome.declarativeNetRequest.MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES) {
                        chrome.declarativeNetRequest.updateDynamicRules({ addRules: [newRuleCopy] })
                            .then(() => {
                                // console.log("addRuleToBrowserDynamicRuleList(): Rule added to browser dynamic rules successfully!");
                                resolve();
                            })
                            .catch((err) => {
                                reject(new Error(err));
                            })
                    } else {
                        reject(new Error("Max number of dynamic rules reached!"));
                    }
                })
                .catch((err) => {
                    reject(new Error("Error retrieving dynamic rule list: " + err));
                })
        }
    })
}

// Edit Rule functions

/**
 * Enables / disables a rule when its toggle checkbox is clicked in the settings page.
 * Adds the rule to the browser dynamic rules list if the rule is being enabled and removes the rule if it is being disabled.
 * Updates the "enabled" field of the rule in the locally-stored rule list.
 * 
 * @param {Event} event The event fired when a checkbox is checked or unchecked
 */
export function toggleRule(event) {
    const checkbox = event.target;
    const checkboxes = document.getElementsByClassName(`checkbox_${checkbox.id}`); // select both checkboxes (in the group section and the all rules section)
    const parameter = checkbox.value;
    const containerCard = document.getElementById(`list_item_${checkbox.id}`);
    const groupItem = document.getElementById(`group_item_${checkbox.id}`);
    utils.getStoredRuleList()
        .then((ruleList) => {
            ruleList.forEach((rule) => {
                if (rule.group !== "GlobalWhitelist" && rule.action.redirect.transform.queryTransform.removeParams[0] === parameter) {
                    if (checkbox.checked) {
                        rule.enabled = true;
                        // console.log("toggleRule(): Enabling rule with parameter:", parameter);
                        addRuleToBrowserDynamicRuleList(rule, true)
                            .then(() => {
                                // console.log("toggleRule(): Rule added to dynamic rule list successfully");
                                if (containerCard) {
                                    containerCard.classList.remove('opacity-50');
                                }
                                groupItem.classList.remove('opacity-50');
                                Object.keys(checkboxes).forEach((key) => checkboxes[key].checked = true);
                            })
                            .catch((err) => {
                                console.error(err);
                                utils.showBottomAlert("Error adding rule to the browser's dynamic rule list: " + err, "danger");
                                return;
                            });
                    } else {
                        rule.enabled = false;
                        // console.log("toggleRule(): Disabling rule with parameter:", parameter);
                        chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [rule.id] })
                            .then(() => {
                                // console.log("toggleRule(): Rule removed from dynamic rule list successfully!");
                                if (containerCard) {
                                    containerCard.classList.add('opacity-50');
                                }
                                groupItem.classList.add('opacity-50');
                                Object.keys(checkboxes).forEach((key) => checkboxes[key].checked = false);
                            })
                            .catch((err) => {
                                console.error("Error removing rule from dynamic rule list:", err);
                                utils.showBottomAlert("Error removing rule from the browser's dynamic rule list: " + err, "danger");
                                return;
                            });
                    }
                    chrome.storage.local.set({ rules: ruleList })
                        .then(() => {
                            // console.log("toggleRule(): Modified rule list saved to local storage successfully");
                        })
                        .catch((err) => {
                            console.error("Modified rule list not saved successfully:", err);
                            utils.showBottomAlert("Error saving rule list in local storage: " + err, "danger");
                        })
                }
            });
        });
}

/**
 * Enabled / disables a global whitelist rule when its toggle checkbox is clicked on the settings page.
 * Adds the rule to the browser dynamic rules list if the rule is being enabled and removes the rule if it is being disabled.
 * Updates the "enabled" field of the rule in the locally-stored rule list.
 * 
 * @param {Event} event The event fired when a checkbox on a global whitelist rule is checked or unchecked
 */
export function toggleGlobalWhitelistRule(event) {
    const checkbox = event.target;
    const domain = checkbox.value;
    const containerCard = document.getElementById(`global_whitelist_item_${checkbox.id}`);

    utils.getStoredRuleList()
        .then((ruleList) => {
            ruleList.forEach((rule) => {
                if (rule.group === "GlobalWhitelist" && rule.condition.requestDomains[0] === domain) {
                    if (checkbox.checked) {
                        rule.enabled = true;
                        addRuleToBrowserDynamicRuleList(rule, true)
                            .then(() => {
                                containerCard.classList.remove('opacity-50');
                            })
                            .catch((err) => {
                                console.error(err);
                                utils.showBottomAlert("Error adding rule to browser's dynamic rule list: " + err, "danger");
                                return;
                            });
                    } else {
                        rule.enabled = false;
                        chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [rule.id] })
                            .then(() => {
                                containerCard.classList.add('opacity-50');
                            })
                            .catch((err) => {
                                console.error("Error removing rule from dynamic rule list:", err);
                                utils.showBottomAlert("Error removing rule from the browser's dynamic rule list: " + err, "danger");
                                return;
                            });
                    }
                    chrome.storage.local.set({ rules: ruleList })
                        .then(() => {
                            // console.log("toggleRule(): Modified rule list saved to local storage successfully");
                        })
                        .catch((err) => {
                            console.error("Modified rule list not saved successfully:", err);
                            utils.showBottomAlert("Error saving rule list in local storage: " + err, "danger");
                        })
                }
            });
        });
}

/**
 * Initializes the rule editing process when the editRuleForm form is submitted
 * 
 * @param {Event} event The event fired with the editRuleForm form is submitted
 */
export function handleEditRule(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    const parameter = formData.get('editParameter');
    const group = formData.get('editGroup');
    const domainFilterType = formData.get('editDomainFilterType');
    const domainFilterList = formData.get('editDomainFilterList');

    let editedRule = new CustomRule(parameter, group, domainFilterType, domainFilterList);

    processEditRule(editedRule);
}

/**
 * Handles editing a rule. Locates the rule to edit, deletes it, adds the edited version, refreshes the UI, and hides the edit overlay.
 * 
 * @param {CustomRule} editedRule The rule to be edited
 */
export function processEditRule(editedRule) {
    // Check for the rule to be edited, and if it can't be found, something went wrong
    utils.checkForDuplicateRule(editedRule)
        .then((rule) => {
            if (!rule) {
                console.error(`Error finding rule to edit: No rule with parameter ${editedRule.parameter} seems to exist!`);
                utils.showBottomAlert(`Error finding rule to edit: No rule with parameter ${editedRule.parameter} seems to exist!`, "danger");
                return;
            } else {
                const enabled = rule.enabled;
                let group = "";
                if (editedRule.group) {
                    group = editedRule.group;
                }
                deleteRule(rule.id)
                    .then(async () => {
                        const editedRuleJson = await editedRule.getRuleJson();
                        addRule(editedRuleJson, enabled, group)
                            .then(() => {
                                // console.log("handleEditRule(): Rule edited successfully!");
                                utils.showBottomAlert("Rule edited successfully!", "success");
                                uiBuilder.refreshRuleLists();
                                uiBuilder.hideEditOverlay();
                            })
                            .catch((err) => {
                                console.error(err);
                                utils.showBottomAlert("Error editing rule: " + err, "danger");
                            });
                    })
                    .catch((err) => {
                        console.error(err);
                        utils.showBottomAlert("Error editing rule: " + err, "danger");
                    });
            }
        })
        .catch((err) => {
            console.error(err);
            utils.showBottomAlert("Error editing rule: " + err, "danger");
        })
}

/**
 * Deletes the rule with ID ruleId from the locally-stored rule list then the browser dynamic rules list.
 * This is done in this order to ensure the rule can be easily added back if removing it from the browser dynamic rules list fails,
 * as the locally-stored rules contain additional fields ("enabled" and "group").
 * 
 * @param {string} ruleId The ID of the rule to delete
 * @returns {Promise} A void promise
 */
export function deleteRule(ruleId) {
    return new Promise((resolve, reject) => {
        const parsedRuleId = parseInt(ruleId);
        if (isNaN(parsedRuleId)) {
            console.error("ruleId function parameter is not a number");
            reject(new Error("ruleId function parameter is not a number!"));
        }
        utils.getStoredRuleList()
            .then((ruleList) => {
                const indexToRemove = ruleList.findIndex((item) => item.id === ruleId);
                if (indexToRemove === -1) {
                    reject(new Error(`Rule with ID ${ruleId} was not found`));
                }
                const ruleToRemove = ruleList[indexToRemove];
                ruleList.splice(indexToRemove, 1);
                // console.log(`deleteRule(): Removing rule with ID ${ruleToRemove.id} from local storage`);
                // console.log("deleteRule(): New list in local storage:", ruleList, "\n");
                chrome.storage.local.set({ rules: ruleList })
                    .then(() => {
                        // console.log("deleteRule(): Local storage updated to remove rule");
                        chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [parsedRuleId] })
                            .then(() => {
                                // console.log("deleteRule(): Rule deleted from browser dynamic rules successfully");
                                const tooltips = [];
                                tooltips.push(document.getElementById(`group_${ruleId}`), document.getElementById(`list_${ruleId}`), document.getElementById(`whitelist_${ruleId}`));
                                for (const tooltip of tooltips) {
                                    if (bootstrap.Tooltip.getInstance(tooltip)) { bootstrap.Tooltip.getInstance(tooltip).hide(); }
                                }
                                resolve();
                            })
                            .catch((err) => {
                                addRuleToLocalStorage(ruleToRemove);
                                reject(new Error("Error deleting rule: " + err));
                            })
                    })
                    .catch((err) => {
                        reject(new Error("Error deleting rule: " + err));
                    })
            })
            .catch((err) => {
                reject(new Error("Error deleting rule: " + err));
            })
    })
}

/**
 * Shows a confirmation modal that prompts the user to confirm that they wish to delete the specified rule.
 * Refreshes the UI if the rule is deleted.
 * 
 * @param {chrome.declarativeNetRequest.Rule} rule The rule whose delete button was clicked.
 */
export function showDeleteRuleConfirmationModal(rule) {
    const parameter = rule.action.redirect.transform.queryTransform.removeParams[0];
    const result = confirm(`Are you sure you want to delete this rule?\n\nParameter: ${parameter}`);

    if (result) {
        deleteRule(rule.id)
            .then(() => {
                //console.log("showConfirmationModal(): Rule deleted successfully");
                uiBuilder.refreshRuleLists();
                utils.showBottomAlert("Rule deleted successfully!", "success");
            })
            .catch((err) => {
                console.error(err);
                utils.showBottomAlert("Error deleting rule: " + err, "danger");
            })
    }
}

/**
 * Shows a confirmation modal that prompts the user to confirm that they wish to delete the specified global whitelist rule.
 * Refreshes the "Global Whitelist Rules" section if the rule is deleted.
 * 
 * @param {chrome.declarativeNetRequest.Rule} rule The rule whose delete button was clicked.
 */
export function showDeleteGlobalWhitelistRuleConfirmationModal(rule) {
    const domain = rule.condition.requestDomains[0];
    const result = confirm(`Are you sure you want to delete this rule?\n\nDomain: ${domain}`);

    if (result) {
        deleteRule(rule.id)
            .then(() => {
                //console.log("showConfirmationModal(): Rule deleted successfully");
                uiBuilder.refreshGlobalWhitelistRuleList();
                utils.showBottomAlert("Rule deleted successfully!", "success");
            })
            .catch((err) => {
                console.error(err);
                utils.showBottomAlert("Error deleting rule: " + err, "danger");
            })
    }
}

// Global Whitelist Rule functions

/**
 * Initializes the global whitelist rule addition process when the addGlobalWhitelistRuleForm form is submitted
 * 
 * @param {Event} event The event fired when the addGlobalWhitelistRuleForm form is submitted
 */
export function handleAddGlobalWhitelistRule(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    const domain = formData.get('globalWhitelistDomain');

    let globalWhitelistRule = new GlobalWhitelistRule(domain);

    processAddGlobalWhitelistRule(globalWhitelistRule);
}

/**
 * Handles adding a global whitelist rule. Checks for duplicates, adds the rule to the browser local storage
 * and the browser dynamic rules list, then hides the form overlay and refreshes the "Global Whitelist Rules" section
 * 
 * @param {GlobalWhitelistRule} newRule The global whitelist rule to be added
 */
export function processAddGlobalWhitelistRule(newRule) {

    utils.checkForDuplicateRule(newRule, true)
        .then(async (rule) => {
            if (rule) {
                // duplicate found
                console.error(`Rule with domain "${newRule.domain}" already exists!`);
                utils.showBottomAlert(`Rule with domain "${newRule.domain}" already exists!`, "warning");
                return;
            } else {
                const newRuleJson = await newRule.getRuleJson();

                addRule(newRuleJson, true, "GlobalWhitelist")
                    .then(() => {
                        utils.showBottomAlert("Rule added successfully!", "success");
                        uiBuilder.refreshGlobalWhitelistRuleList();
                        uiBuilder.hideWhitelistOverlay();
                    })
                    .catch((err) => {
                        console.error(err);
                        utils.showBottomAlert("Error adding rule: " + err, "danger");
                    });
            }
        })
        .catch((err) => {
            console.error(err);
            utils.showBottomAlert("Error adding rule: " + err, "danger");
        });
}