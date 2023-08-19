import * as ruleManagement from "./rule-management.js";
import * as utils from "./utils.js";
import { CustomRule } from "../resources/CustomRuleClass.js";
import { setEditDomainListFieldValidity } from "./form-validation.js";

// Edit Overlay management

/**
 * Populates the editRuleForm form with the information of the rule whose edit button was clicked and shows the edit overlay
 * 
 * @param {chrome.declarativeNetRequest.Rule} rule The rule whose edit button was clicked
 */
export function showEditOverlay(rule) {
    const editOverlayContainer = document.getElementById('editOverlayContainer');
    const editParameter = document.getElementById('editParameter');
    const editGroup = document.getElementById('editGroup');
    const cancelButton = document.getElementById('cancelButton');
    const editRuleId = document.getElementById('editRuleId');
    const editDomainFilterList = document.getElementById('editDomainFilterList');
    const editWhitelistRadio = document.getElementById('editWhitelistRadio');
    const editBlacklistRadio = document.getElementById('editBlacklistRadio');

    editParameter.value = rule.action.redirect.transform.queryTransform.removeParams[0];
    editRuleId.value = rule.id;

    if (rule.group) {
        editGroup.value = rule.group;
    } else {
        editGroup.value = "";
    }

    // set the checkboxes

    if (rule.condition.requestDomains) { // blacklist was chosen
        const commaSeparatedDomains = rule.condition.requestDomains.join(', ');
        editDomainFilterList.value = commaSeparatedDomains;
        editBlacklistRadio.checked = true;
    } else if (rule.condition.excludedRequestDomains) { // whitelist was chosen
        const commaSeparatedDomains = rule.condition.excludedRequestDomains.join(', ');
        editDomainFilterList.value = commaSeparatedDomains;
        editWhitelistRadio.checked = true;
    } else {
        editWhitelistRadio.checked = true;
        editDomainFilterList.value = "";
    }

    cancelButton.addEventListener('click', () => {
        editOverlayContainer.style.display = 'none';
    });

    setEditDomainListFieldValidity();

    editOverlayContainer.style.display = 'flex'; // show the overlay
}

/**
 * Hides the edit overlay.
 */
export function hideEditOverlay() {
    const editOverlayContainer = document.getElementById('editOverlayContainer');
    editOverlayContainer.style.display = 'none';
}

// Rule Group management

/**
 * Generates the groups of rules in the "Rule Groups" section of the settings page.
 * Retrieves the rule groups and creates Bootstrap accordion elements to contain each group's rules
 */
export function generateRuleGroupList() {
    const container = document.getElementById('ruleGroupListContainer');

    utils.getStoredRuleList()
        .then(async (ruleList) => {

            ruleList = ruleList.filter(rule => rule.group !== "GlobalWhitelist");

            const row = document.createElement('div');
            row.className = "row";

            const groups = await utils.getGroupArrays(ruleList);

            Object.keys(groups).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).forEach((groupName) => {

                const ruleArr = groups[groupName];

                const ruleGroupElement = createRuleGroupElement(ruleArr);
                row.appendChild(ruleGroupElement);

                container.appendChild(row);
            });
        });
}

/**
 * Returns an HTML element containing a collapsable Bootstrap accordion element containing the group's rules.
 * 
 * @param {string} group The group the rule is a part of. "" if no group.
 * @returns {HTMLDivElement} An HTML element containing a collapsable Bootstrap accordion element containing the group's rules
 */
export function createRuleGroupElement(group) {

    const groupName = group[0].group.replace(/ /g, "_").replace(/\./g, "-");

    // Create a column div to contain the accordion
    const columnDiv = document.createElement('div');
    columnDiv.className = "col-12 col-md-6 col-xl-4 col-xxl-3";

    // Create accordion to hold rule group information
    const accordion = document.createElement('div');
    accordion.className = 'accordion m-1';
    accordion.id = `accordion_${groupName}`;
    columnDiv.appendChild(accordion);

    const accordionItem = document.createElement('div');
    accordionItem.className = "accordion-item";
    accordion.appendChild(accordionItem);

    const accordionHeader = document.createElement('h2');
    accordionHeader.className = "accordion-header";
    accordionItem.appendChild(accordionHeader);

    const accordionButton = document.createElement('button');
    accordionButton.className = "accordion-button collapsed";
    accordionButton.type = "button";
    accordionButton.id = `accordion_button_${groupName}`;
    accordionButton.textContent = group[0].group;
    accordionButton.setAttribute('data-bs-toggle', 'collapse');
    accordionButton.setAttribute('data-bs-target', `#collapse_${groupName}`);
    accordionButton.setAttribute('aria-controls', `collapse_${groupName}`);
    accordionButton.setAttribute('aria-expanded', 'false');
    accordionHeader.appendChild(accordionButton);

    accordionButton.addEventListener('mouseover', () => {
        accordionButton.classList.add('hovered');
        group.forEach((rule) => {
            const ruleListItem = document.getElementById(`list_item_${rule.id}`);
            if (ruleListItem) {
                ruleListItem.classList.add('hovered');
            }
        });
    });

    accordionButton.addEventListener('mouseout', () => {
        accordionButton.classList.remove('hovered');
        group.forEach((rule) => {
            const ruleListItem = document.getElementById(`list_item_${rule.id}`);
            if (ruleListItem) {
                ruleListItem.classList.remove('hovered');
            }
        });
    });

    accordionButton.addEventListener('click', () => {
        registerGroupTooltips(groupName);
    })

    // Create a collapsable div

    const collapse = document.createElement('div');
    collapse.className = "accordion-collapse collapse";
    collapse.id = `collapse_${groupName}`;
    collapse.setAttribute('data-bs-parent', `#accordion_${groupName}`);
    accordionItem.appendChild(collapse);

    const collapseBody = document.createElement('div');
    collapseBody.className = 'accordion-body p-2';
    collapse.appendChild(collapseBody);

    const list = document.createElement('ul');
    list.className = "list-group";
    collapseBody.appendChild(list);

    group.forEach((rule) => {
        const ruleListItem = createRuleElement(rule, "group_item");
        list.appendChild(ruleListItem);
    });

    return columnDiv;
}

// Rule List management

/**
 * Generates the list of rules in the "All Rules" section of the settings page
 */
export function generateRuleList() {
    const container = document.getElementById('ruleListContainer');

   utils.getStoredRuleList()
        .then((ruleList) => {

            // Remove global whitelist rules
            ruleList = ruleList.filter(rule => rule.group !== "GlobalWhitelist");

            ruleList.sort((a, b) => {
                return a.action.redirect.transform.queryTransform.removeParams[0].localeCompare(b.action.redirect.transform.queryTransform.removeParams[0], undefined, { sensitivity: 'base' });
            });

            const row = document.createElement('div');
            row.className = "row";

            ruleList.forEach((rule) => {

                // Create a column div to contain the cards
                const columnDiv = document.createElement('div');
                columnDiv.className = "col-12 col-md-6 col-xl-4 col-xxl-3";

                const ruleElement = createRuleElement(rule, "list_item");
                columnDiv.appendChild(ruleElement);
                row.appendChild(columnDiv);
            });
            container.appendChild(row);
            registerAllRulesListTooltips();
        });
}

/**
 * Refreshes the "Rule Groups", "All Rules", and "Global Whitelist Rules" sections of the settings page
 */
export function refreshRuleLists() {
    const ruleListContainer = document.getElementById('ruleListContainer');
    ruleListContainer.innerHTML = "";
    const ruleGroupListContainer = document.getElementById('ruleGroupListContainer');
    ruleGroupListContainer.innerHTML = "";
    const showRuleListButton = document.getElementById('showRuleListButton');
    if (showRuleListButton.textContent === 'Hide') {
        generateRuleList();
    }
    generateRuleGroupList();
    refreshGlobalWhitelistRuleList();
}

/**
 * Refreshes the "Global Whitelist Rules" section of the settings page
 */
export function refreshGlobalWhitelistRuleList() {
    const globalWhitelistRuleListContainer = document.getElementById('globalWhitelistRuleListContainer');
    globalWhitelistRuleListContainer.innerHTML = "";
    generateGlobalWhitelistRuleList();
}

/**
 * Creates a Bootstrap card element representing the passed in rule. The card contains the rule parameter,
 * group icon (optional), whitelist/blacklist icon, toggle checkbox, edit button, and delete button.
 * 
 * Cards in the "Rule Groups" section (the "group_item" type) only contain a toggle checkbox and a delete button.
 * 
 * @param {chrome.declarativeNetRequest.Rule} rule The rule object to create an element for. Also contains the "enabled" and optionally the "group" fields used by the extension
 * @param {string} type Either "list_item" for rules in the "All Rules" section or "group_item" for rules in the "Rule Groups" section
 * @returns {HTMLDivElement} The Bootstrap card element representing a rule
 */
export function createRuleElement(rule, type) {
    // Create card to hold rule information
    const card = document.createElement('div');
    card.className = "card px-2 m-1";
    card.id = `${type}_${rule.id}`;

    if (rule.group) {
        var groupName = rule.group.replace(/ /g, "_").replace(/\./g, "-");
    }

    // add event listeners that highlight the other instance of the rule too when hovered
    // for example, if creating a rule card for the "all rules" list, add an event listener that
    // will select the corresponding card in the group (if it exists) and also highlight it

    let otherCardType = 'list_item';
    if (type === 'list_item') {
        otherCardType = 'group_item';
    }

    card.addEventListener('mouseover', () => {
        card.classList.add('hovered');
        if (rule.group) {
            const otherCard = document.getElementById(`${otherCardType}_${rule.id}`);
            if (otherCard) {
                otherCard.classList.add('hovered');
                const groupAccordion = document.getElementById(`accordion_button_${groupName}`);
                groupAccordion.classList.add('hovered');
            }
        }
    });

    card.addEventListener('mouseout', () => {
        card.classList.remove('hovered');
        if (rule.group) {
            const otherCard = document.getElementById(`${otherCardType}_${rule.id}`);
            if (otherCard) {
                otherCard.classList.remove('hovered');
                const groupAccordion = document.getElementById(`accordion_button_${groupName}`);
                groupAccordion.classList.remove('hovered');
            }
        }
    });

    const cardBody = document.createElement('div');
    cardBody.className = "card-body row py-1 px-1 align-items-center";
    cardBody.style = "font-size: 0.9rem";
    card.appendChild(cardBody);

    const cardText = document.createElement('p');
    cardText.className = "card-text col m-0";
    cardText.textContent = rule.action.redirect.transform.queryTransform.removeParams[0];
    cardBody.appendChild(cardText);

    // Create a right-aligned div for the checkbox, edit button, and delete button

    const rightAlignedDiv = document.createElement('div');
    rightAlignedDiv.className = "text-end col";
    cardBody.appendChild(rightAlignedDiv);

    // Create a flex div

    const flexDiv = document.createElement('div');
    flexDiv.className = "col d-flex justify-content-end align-items-center";
    rightAlignedDiv.appendChild(flexDiv);

    // Create the group icon, blacklist/whitelist indicator, checkbox, edit button, and delete button

    if (type === 'list_item' && rule.group) { // only show group icon on rule cards in the "all rules" section
        const groupIcon = document.createElement('i');
        groupIcon.className = `fas fa-layer-group me-2 list_item`;
        groupIcon.style = "color: black;";
        groupIcon.setAttribute('data-bs-toggle', 'tooltip');
        groupIcon.setAttribute('title', `Group: ${rule.group}`);
        flexDiv.appendChild(groupIcon);
    }

    const listIcon = document.createElement('i');

    if (rule.condition.requestDomains) { // blacklist was chosen
        listIcon.className = "fas fa-times-circle";
        listIcon.style = "color: black;";
        listIcon.setAttribute("data-bs-toggle", "tooltip");
        listIcon.setAttribute("title", `Blacklisted domains: ${rule.condition.requestDomains[0]}, ...`);
    } else if (rule.condition.excludedRequestDomains) { // whitelist was chosen and has domains
        listIcon.className = "fas fa-check";
        listIcon.style = "color: gray";
        listIcon.setAttribute("data-bs-toggle", "tooltip");
        listIcon.setAttribute("title", `Whitelisted domains: ${rule.condition.excludedRequestDomains[0]}, ...`);
    } else { // whitelist was chosen and has no domains
        listIcon.className = "fas fa-check";
        listIcon.style = "color: gray";
        listIcon.setAttribute("data-bs-toggle", "tooltip");
        listIcon.setAttribute("title", "Whitelist: parameter is removed on all domains");
    }

    const checkboxDiv = document.createElement('div');
    checkboxDiv.className = "form-check ms-2 mt-1";
    const checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.id = rule.id;
    checkbox.value = cardBody.textContent;
    checkbox.className = `form-check-input checkbox_${rule.id}`;
    checkbox.setAttribute("data-bs-toggle", "tooltip");
    checkbox.setAttribute("title", "Toggle Rule");

    if (rule.enabled) {
        checkbox.checked = 'true';
    } else {
        card.classList.add(['opacity-50']);
    }

    checkbox.addEventListener('click', ruleManagement.toggleRule);
    checkboxDiv.appendChild(checkbox);

    const editButton = createIconButton("far fa-edit");
    editButton.style = "--bs-btn-padding-x: 0.2rem; --bs-btn-padding-y: 0; color: black;";
    editButton.setAttribute("data-bs-toggle", "tooltip");
    editButton.setAttribute("data-bs-placement", "top");
    editButton.setAttribute("title", "Edit Rule");
    editButton.addEventListener('click', () => showEditOverlay(rule));

    const deleteButton = createIconButton("far fa-trash-alt");
    deleteButton.style = "--bs-btn-padding-x: 0.3rem; --bs-btn-padding-y: 0; color: red;";
    deleteButton.setAttribute("data-bs-toggle", "tooltip");
    deleteButton.setAttribute("title", "Delete Rule");
    deleteButton.addEventListener('click', () => ruleManagement.showDeleteRuleConfirmationModal(rule));

    if (type === 'list_item') {
        listIcon.classList.add('list_item');
        checkbox.classList.add('list_item');
        editButton.classList.add('list_item');
        deleteButton.classList.add('list_item');
    } else {
        listIcon.classList.add(`group_${groupName}`);
        checkbox.classList.add(`group_${groupName}`);
        editButton.classList.add(`group_${groupName}`);
        deleteButton.classList.add(`group_${groupName}`);
    }

    flexDiv.appendChild(listIcon);
    flexDiv.appendChild(checkboxDiv);
    flexDiv.appendChild(editButton);
    flexDiv.appendChild(deleteButton);

    return card;
}

/**
 * Returns an HTML button element that appears as a FontAwesome icon
 * 
 * @param {string} iconClass The css classes of the icon. These are FontAwesome classes (for example, "far fa-edit")
 * 
 * @returns {HTMLButtonElement} A Button element with a FontAwesome icon
 */
export function createIconButton(iconClass) {
    const button = document.createElement("button");
    button.className = 'btn';

    const icon = document.createElement("i");
    icon.className = iconClass;

    button.appendChild(icon);
    return button;
}

// Global Whitelist management 

/**
 * Shows the overlay containing the addGlobalWhitelistRuleForm form
 */
export function showWhitelistOverlay() {
    const whitelistOverlayContainer = document.getElementById('whitelistOverlayContainer');
    const whitelistCancelButton = document.getElementById('whitelistCancelButton');
    whitelistCancelButton.addEventListener('click', () => {
        whitelistOverlayContainer.style.display = 'none';
    });
    whitelistOverlayContainer.style.display = 'flex';
}

/**
 * Hides the overlay containing the addGlobalWhitelistRuleForm form
 */
export function hideWhitelistOverlay() {
    const whitelistOverlayContainer = document.getElementById('whitelistOverlayContainer');
    whitelistOverlayContainer.style.display = 'none';
}

/**
 * Generates the list of rules in the "Global Whitelist Rules" section of the settings page
 */
export function generateGlobalWhitelistRuleList() {
    const container = document.getElementById('globalWhitelistRuleListContainer');

    utils.getStoredRuleList()
        .then((ruleList) => {

            ruleList = ruleList.filter(rule => rule.group === "GlobalWhitelist");

            ruleList.sort((a, b) => {
                return a.condition.requestDomains[0].localeCompare(b.condition.requestDomains[0], undefined, { sensitivity: 'base' });
            });

            const row = document.createElement('div');
            row.className = "row";

            ruleList.forEach((rule) => {

                // Create a column div to contain the cards
                const columnDiv = document.createElement('div');
                columnDiv.className = "col-12 col-md-6 col-xl-4 col-xxl-3";

                const ruleElement = createGlobalWhitelistElement(rule);
                columnDiv.appendChild(ruleElement);
                row.appendChild(columnDiv);
            });
            container.appendChild(row);
            registerGlobalWhitelistRulesTooltips();
        })
}

/**
 * Creates a Bootstrap card element representing a global whitelist rule. The card contains the domain, a toggle checkbox, and a delete button
 * 
 * @param {chrome.declarativeNetRequest.Rule} rule The rule object to create an element for. Also contains the "enabled" and optionally the "group" fields used by the extension
 * @returns {HTMLDivElement} The Bootstrap card element representing a rule
 */
export function createGlobalWhitelistElement(rule) {
    const card = document.createElement('div');
    card.className = "card px-2 m-1";
    card.id = `global_whitelist_item_${rule.id}`;

    card.addEventListener('mouseover', () => {
        card.classList.add('hovered');
    });

    card.addEventListener('mouseout', () => {
        card.classList.remove('hovered');
    });

    const cardBody = document.createElement('div');
    cardBody.className = "card-body row py-1 align-items-center";
    cardBody.style = "font-size: 0.9rem";
    card.appendChild(cardBody);

    const cardText = document.createElement('p');
    cardText.className = "card-text col m-0";
    cardText.textContent = rule.condition.requestDomains[0];
    cardBody.appendChild(cardText);

    // Create a right-aligned div for the checkbox and delete button

    const rightAlignedDiv = document.createElement('div');
    rightAlignedDiv.className = "text-end col";
    cardBody.appendChild(rightAlignedDiv);

    // Create a flex div

    const flexDiv = document.createElement('div');
    flexDiv.className = "col d-flex justify-content-end align-items-center";
    rightAlignedDiv.appendChild(flexDiv);

    // Create the checkbox and delete button

    const checkboxDiv = document.createElement('div');
    checkboxDiv.className = "form-check ms-2 mt-1";
    const checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.id = rule.id;
    checkbox.value = cardBody.textContent;
    checkbox.className = "form-check-input global_whitelist";
    checkbox.setAttribute("data-bs-toggle", "tooltip");
    checkbox.setAttribute("title", "Toggle Rule");

    if (rule.enabled) {
        checkbox.checked = 'true';
    } else {
        card.classList.add(['opacity-50']);
    }

    checkbox.addEventListener('click', ruleManagement.toggleGlobalWhitelistRule);
    checkboxDiv.appendChild(checkbox);

    const deleteButton = createIconButton("far fa-trash-alt");
    deleteButton.style = "--bs-btn-padding-x: 0.3rem; --bs-btn-padding-y: 0; color: red;";
    deleteButton.classList.add("global_whitelist");
    deleteButton.setAttribute("data-bs-toggle", "tooltip");
    deleteButton.setAttribute("title", "Delete Rule");
    deleteButton.addEventListener('click', () => ruleManagement.showDeleteGlobalWhitelistRuleConfirmationModal(rule));

    flexDiv.appendChild(checkboxDiv);
    flexDiv.appendChild(deleteButton);

    return card;
}

// Bootstrap tooltips

/**
 * Initializes the Bootstrap tooltips found on the cards in the "All Rules" section
 */
export function registerAllRulesListTooltips() {
    const tooltipTriggerList = document.querySelectorAll('.list_item');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerElement => new bootstrap.Tooltip(tooltipTriggerElement));
}

/**
 * Initializes the Bootstrap tooltips found on the settings page, not rule cards
 */
export function registerMainTooltips() {
    const tooltipTriggerList = document.querySelectorAll('.main_tooltip');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerElement => new bootstrap.Tooltip(tooltipTriggerElement));
}

/**
 * Initializes the Bootstrap tooltips found on the cards in the "Rule Groups" section
 * 
 * @param {string} groupName The name of the group of rules whose tooltips are to be registered
 */
export function registerGroupTooltips(groupName) {
    const tooltipTriggerList = document.querySelectorAll(`.group_${groupName}`);
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerElement => new bootstrap.Tooltip(tooltipTriggerElement));
}

/**
 * Initializes the Bootstrap tooltips found on the cards in the "Global Whitelist Rules" section
 */
export function registerGlobalWhitelistRulesTooltips() {
    const tooltipTriggerList = document.querySelectorAll('.global_whitelist');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerElement => new bootstrap.Tooltip(tooltipTriggerElement));
}

/**
 * Registers all the Bootstrap tooltips on the card elements in the 
 * "Add Rules Via URL" section when a URL is submitted by the user
 */
export function registerUrlItemTooltips() {
    const tooltipTriggerList = document.querySelectorAll('.url_param_item');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerElement => new bootstrap.Tooltip(tooltipTriggerElement));
}

// "Add Rules Via URL" section management

/**
 * Generates the list of parameters in the "Add Rules Via URL" section when the "Get Parameters" button is clicked
 */
export function generateUrlParamList() {
    const generatedParamsContainer = document.getElementById('generatedParamsContainer');
    let urlInput = document.getElementById('urlInput');
    let urlInputValue = urlInput.value;
    const urlRegex = /^(http|https):\/\/[\w\-]+(\.[\w\-]+)+([/?#].*)?$/;

    if (urlInputValue.search("http://") === -1 && urlInputValue.search("https://") === -1) {
        urlInputValue = "https://" + urlInputValue;
        urlInput.value = urlInputValue
    }

    if (!urlInputValue.length) {
        urlInput.setCustomValidity("Please enter a URL!");
        urlInput.classList.add('is-invalid');
        urlInput.classList.remove('is-valid');
        urlInput.reportValidity();
        return;
    } else if (!urlRegex.test(urlInputValue)) {
        urlInput.setCustomValidity("Invalid URL!");
        urlInput.classList.add('is-invalid');
        urlInput.classList.remove('is-valid');
        urlInput.reportValidity();
        return;
    }

    let url;
    let params;

    try {
        url = new URL(urlInputValue);
        const query = url.search;
        params = new URLSearchParams(query);
    } catch (e) {
        urlInput.setCustomValidity("Invalid URL!");
        urlInput.classList.add('is-invalid');
        urlInput.classList.remove('is-valid');
        urlInput.reportValidity();
        return;
    }

    if (params.keys().next().done) {
        utils.showBottomAlert("URL appears to have no parameters!", "warning");
        return;
    }

    urlInput.setCustomValidity("");
    urlInput.classList.add('is-valid');
    urlInput.classList.remove('is-invalid');
    urlInput.reportValidity();

    generatedParamsContainer.innerHTML = "";

    const domain = url.hostname.replace(/^www\./i, '');

    const row = document.createElement('div');
    row.className = "row";

    params.forEach((value, param) => {
        
        const columnDiv = document.createElement('div');
        columnDiv.className = "col-12 col-md-6 col-xl-4 col-xxl-3";

        const card = createUrlParamElement(domain, param, value);
        columnDiv.appendChild(card);
        row.appendChild(columnDiv);
    });
    generatedParamsContainer.appendChild(row);

    registerUrlItemTooltips();
}

/**
 * Creates a bootstrap card element containing a URL parameter, its value in the URL as a tooltip, and an add button
 * 
 * @param {string} domain The domain in the URL the user entered
 * @param {string} param A parameter in the URL the user entered
 * @param {string} value param's value in the URL
 * @returns {HTMLDivElement} A Bootstrap card element representing a parameter with an add button
 */
export function createUrlParamElement(domain, param, value) {

    const card = document.createElement('div');
    card.className = "card px-2 m-1 url_param_item";
    card.setAttribute('data-bs-toggle', 'tooltip');
    card.setAttribute('title', `Value in URL: "${value}"`);

    card.addEventListener('mouseover', () => {
        card.classList.add('hovered');
    });

    card.addEventListener('mouseout', () => {
        card.classList.remove('hovered');
    });

    const cardBody = document.createElement('div');
    cardBody.className = "card-body row py-1 px-1 align-items-center";
    cardBody.style = "font-size: 0.9rem";
    card.appendChild(cardBody);

    const cardText = document.createElement('p');
    cardText.className = "card=text col m-0";
    cardText.textContent = param;
    cardBody.appendChild(cardText);


    // Create a right-aligned div for the add button

    const rightAlignedDiv = document.createElement('div');
    rightAlignedDiv.className = "text-end col";
    cardBody.appendChild(rightAlignedDiv);

    // Create a flex div

    const flexDiv = document.createElement('div');
    flexDiv.className = "col d-flex justify-content-end align-items-center";
    rightAlignedDiv.appendChild(flexDiv);

    const addButton = createIconButton("fas fa-plus");
    addButton.style = "color: black;";
    addButton.setAttribute("data-bs-toggle", "tooltip");
    addButton.setAttribute("data-bs-placement", "bottom");
    addButton.setAttribute("title", "Add Rule");
    addButton.classList.add('url_param_item');
    addButton.addEventListener('click', () => {
        const newRule = new CustomRule(param, domain, "Blacklist", domain);
        ruleManagement.processAddRule(newRule);
    });

    flexDiv.appendChild(addButton);

    return card;
}