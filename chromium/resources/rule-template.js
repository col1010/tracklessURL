export default {
    "id": 1,
    "priority": 1,
    "action": {
        "type": "redirect",
        "redirect": {
            "transform": {
                "queryTransform": {
                    "removeParams": []
                }
            }
        }
    },
    "condition": {
        "isUrlFilterCaseSensitive": true,
        "regexFilter": "",
        "resourceTypes": ["main_frame"]
    }
}

