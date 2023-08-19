import { CustomRule } from "../resources/CustomRuleClass.js";

/**
 * Validates the value of the parameter field in the addRuleForm form.
 */
export function setParameterFieldValidity() {
    const parameterField = document.getElementById('parameter');

    if (parameterField.value === '') {
        parameterField.setCustomValidity("Please enter a parameter");
        parameterField.classList.add('is-invalid');
        parameterField.classList.remove('is-valid');
    } else if (!CustomRule.isValidParameter(parameterField.value)) {
        parameterField.setCustomValidity("Parameter contains invalid characters. Valid characters include a-z, A-Z, 0-9, \"-\", and \"_\"");
        parameterField.classList.add('is-invalid');
        parameterField.classList.remove('is-valid');
    } else if (parameterField.value.length > 30) {
        parameterField.setCustomValidity("Parameter is too long (>30 characters)");
        parameterField.classList.add('is-invalid');
        parameterField.classList.remove('is-valid');
    } else {
        // Clear the validity message
        parameterField.setCustomValidity("");
        parameterField.classList.remove('is-invalid');
        parameterField.classList.add('is-valid');
    }
    parameterField.reportValidity();
}

/**
 * Validates the value of the group field in the addRuleForm form.
 */
export function setGroupFieldValidity() {
    const groupField = document.getElementById('group');

    if (!CustomRule.isValidGroup(groupField.value)) {
        groupField.setCustomValidity("Group contains invalid characters. Valid characters include a-z, A-Z, 0-9, \" \", \"-\", \".\", and \"_\"");
        groupField.classList.add('is-invalid');
        groupField.classList.remove('is-valid');
    } else if (groupField.value.length > 30) {
        groupField.setCustomValidity("Group is too long (>30 characters)");
        groupField.classList.add('is-invalid');
        groupField.classList.remove('is-valid');
    } else if (groupField.value === "GlobalWhitelist") {
        groupField.setCustomValidity("The \"GlobalWhitelist\" group name is reserved and cannot be used");
        groupField.classList.add('is-invalid');
        groupField.classList.remove('is-valid');
    } else {
        groupField.setCustomValidity("");
        groupField.classList.remove('is-invalid');
        groupField.classList.add('is-valid');
    }
    groupField.reportValidity();
}

/**
 * Validates the value of the group field in the editRuleForm form.
 */
export function setEditGroupFieldValidity() {
    const editGroupField = document.getElementById('editGroup');

    if (!CustomRule.isValidGroup(editGroupField.value)) {
        editGroupField.setCustomValidity("Group contains invalid characters. Valid characters include a-z, A-Z, 0-9, \" \", \"-\", \".\", and \"_\"");
        editGroupField.classList.add('is-invalid');
        editGroupField.classList.remove('is-valid');
    } else if (editGroupField.value.length > 30) {
        editGroupField.setCustomValidity("Group is too long (>30 characters)");
        editGroupField.classList.add('is-invalid');
        editGroupField.classList.remove('is-valid');
    } else if (editGroupField.value === "GlobalWhitelist") {
        editGroupField.setCustomValidity("The \"GlobalWhitelist\" group name is reserved and cannot be used");
        editGroupField.classList.add('is-invalid');
        editGroupField.classList.remove('is-valid');
    } else {
        editGroupField.setCustomValidity(""); // reset the validity message
        editGroupField.classList.remove('is-invalid');
        editGroupField.classList.add('is-valid');
    }
    editGroupField.reportValidity();
}

/**
 * Validates the value of the domain list textarea in the addRuleForm form.
 */
export function setDomainListFieldValidity() {
    const domainListField = document.getElementById("domainFilterList");

    const blacklistRadio = document.getElementById("blacklistRadio");
    if (blacklistRadio.checked && domainListField.value === '') {
        domainListField.setCustomValidity("Blacklist must contain at least one domain");
        domainListField.classList.remove('is-valid');
        domainListField.classList.add('is-invalid');
    } else if (!CustomRule.validateDomains(domainListField.value)) {
        domainListField.setCustomValidity("Domain list is invalid. Please enter valid comma-separated domains");
        domainListField.classList.remove('is-valid');
        domainListField.classList.add('is-invalid');
    } else {
        domainListField.setCustomValidity("");
        domainListField.classList.remove('is-invalid');
        domainListField.classList.add('is-valid');
    }
    domainListField.reportValidity();
}

/**
 * Validates the value of the domain list textarea in the editRuleForm form.
 */
export function setEditDomainListFieldValidity() {
    const editDomainListField = document.getElementById("editDomainFilterList");

    const editBlacklistRadio = document.getElementById("editBlacklistRadio");
    if (editBlacklistRadio.checked && editDomainListField.value === '') {
        editDomainListField.setCustomValidity("Blacklist must contain at least one domain");
        editDomainListField.classList.remove('is-valid');
        editDomainListField.classList.add('is-invalid');
    } else if (!CustomRule.validateDomains(editDomainListField.value)) {
        editDomainListField.setCustomValidity("Domain list is invalid. Please enter valid comma-separated domains");
        editDomainListField.classList.remove('is-valid');
        editDomainListField.classList.add('is-invalid');
    } else {
        editDomainListField.setCustomValidity("");
        editDomainListField.classList.remove('is-invalid');
        editDomainListField.classList.add('is-valid');
    }
    editDomainListField.reportValidity();
}

/**
 * Validates the value of the domain field in the addGlobalWhitelistRuleForm form.
 */
export function setGlobalWhitelistDomainFieldValidity() {
    const globalWhitelistDomainField = document.getElementById('globalWhitelistDomain');

    if(!CustomRule.isValidDomain(globalWhitelistDomainField.value)) {
        globalWhitelistDomainField.setCustomValidity("Domain is invalid. Valid characters include a-z, A-Z, 0-9, \"-\", and \".\"");
        globalWhitelistDomainField.classList.add('is-invalid');
        globalWhitelistDomainField.classList.remove('is-valid');
    } else {
        globalWhitelistDomainField.setCustomValidity("");
        globalWhitelistDomainField.classList.remove('is-invalid');
        globalWhitelistDomainField.classList.add('is-valid');
    }

    globalWhitelistDomainField.reportValidity();
}

/**
 * Sets the domainFilterList textarea in the addRuleForm form to
 * "required" when the "Blacklist" radio button is selected
 * and removes "required" when "Whitelist" is selected
 */
export function handleDomainFilterTypeChange() {
    const domainFilterTypeRadioButtons = document.getElementsByName('domainFilterType');
    const domainFilterListTextArea = document.getElementById('domainFilterList');
    for (const radio of domainFilterTypeRadioButtons) {
        if (radio.checked && radio.value === 'Blacklist') {
            domainFilterListTextArea.setAttribute('required', 'required');
        } else {
            domainFilterListTextArea.removeAttribute('required');
        }
    }
    setDomainListFieldValidity();
}

/**
 * Sets the editDomainFilterList textarea in the editRuleForm form to
 * "required" when the "Blacklist" radio button is selected
 * and removes "required" when "Whitelist" is selected
 */
export function handleEditDomainFilterTypeChange() {
    const domainFilterTypeRadioButtons = document.getElementsByName('editDomainFilterType');
    const domainFilterListTextArea = document.getElementById('editDomainFilterList');
    for (const radio of domainFilterTypeRadioButtons) {
        if (radio.checked && radio.value === 'Blacklist') {
            domainFilterListTextArea.setAttribute('required', 'required');
        } else {
            domainFilterListTextArea.removeAttribute('required');
        }
    }
    setEditDomainListFieldValidity();
}