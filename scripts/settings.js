import * as formValidation from "./form-validation.js";
import { handleAddRule, handleEditRule, handleAddGlobalWhitelistRule } from "./rule-management.js";
import * as uiBuilder from "./ui-builder.js"

// Event listeners

document.addEventListener("DOMContentLoaded", function () {

    // Set the behavior of the addRuleForm form
    const addRuleForm = document.getElementById("addRuleForm");
    addRuleForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!addRuleForm.checkValidity()) {
            // console.error("Add form invalid!");
            formValidation.setDomainListFieldValidity();
            formValidation.setParameterFieldValidity();
            formValidation.setGroupFieldValidity();
        } else {
            handleAddRule(event);
        }
    });
    
    const domainFilterTypeRadioButtons = document.getElementsByName('domainFilterType');
    for (const radio of domainFilterTypeRadioButtons) {
        radio.addEventListener('change', formValidation.handleDomainFilterTypeChange);
    }

    // Set the behavior of the editRuleForm form
    const editRuleForm = document.getElementById("editRuleForm");
    editRuleForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!editRuleForm.checkValidity()) {
            // console.error("Edit form invalid!");
            formValidation.setEditDomainListFieldValidity();
        } else {
            handleEditRule(event);
        }
    });

    // Set the behavior of the addGlobalWhitelistRuleForm form
    const addGlobalWhitelistRuleForm = document.getElementById("addGlobalWhitelistRuleForm");
    addGlobalWhitelistRuleForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!addGlobalWhitelistRuleForm.checkValidity()) {
            // console.error("Edit form invalid!");
            formValidation.setGlobalWhitelistDomainFieldValidity();
        } else {
            handleAddGlobalWhitelistRule(event);
        }
    });

    const editDomainFilterTypeRadioButtons = document.getElementsByName('editDomainFilterType');
    for (const radio of editDomainFilterTypeRadioButtons) {
        radio.addEventListener('change', formValidation.handleEditDomainFilterTypeChange);
    }

    const showRuleListButton = document.getElementById('showRuleListButton');
    showRuleListButton.addEventListener('click', function () {
        if (showRuleListButton.textContent === 'Show') {
            showRuleListButton.textContent = 'Hide';
            uiBuilder.generateRuleList();
        } else {
            showRuleListButton.textContent = 'Show';
            const ruleListContainer = document.getElementById('ruleListContainer');
            ruleListContainer.innerHTML = "";
        }
    });

    const addGlobalWhitelistRuleButton = document.getElementById('addGlobalWhitelistRuleButton');
    addGlobalWhitelistRuleButton.addEventListener('click', function () {
        uiBuilder.showWhitelistOverlay();
    })

    // Add Rules Via URL listeners

    const getParamsButton = document.getElementById('getParamsButton');
    getParamsButton.addEventListener('click', uiBuilder.generateUrlParamList);

    // Form validation

    const parameterField = document.getElementById('parameter');
    parameterField.addEventListener('input', formValidation.setParameterFieldValidity);

    const domainListField = document.getElementById("domainFilterList");
    domainListField.addEventListener('input', formValidation.setDomainListFieldValidity);

    const groupField = document.getElementById('group');
    groupField.addEventListener('input', formValidation.setGroupFieldValidity);

    const editGroupField = document.getElementById('editGroup');
    editGroupField.addEventListener('input', formValidation.setEditGroupFieldValidity);

    const editDomainListField = document.getElementById("editDomainFilterList");
    editDomainListField.addEventListener('input', formValidation.setEditDomainListFieldValidity);

    const globalWhitelistDomainField = document.getElementById('globalWhitelistDomain');
    globalWhitelistDomainField.addEventListener('input', formValidation.setGlobalWhitelistDomainFieldValidity);

    uiBuilder.registerMainTooltips();

    uiBuilder.generateRuleGroupList();
    uiBuilder.generateGlobalWhitelistRuleList();
})