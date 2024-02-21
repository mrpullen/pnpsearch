## Search Extensions

The release contains the following asset - used to extend the PNP Search v4 web parts.

| Name              | Id                                   | Package |
| ----------------- | ------------------------------------ | ------- |
| search-extensions | e1a01f70-49ce-43b4-9fbc-2a6ad50cdd40 | search-extensions-<version_number>.sppkg |

Information on how to use the extensions can be found on the links below.

## Useful resources

[Sample Extensions](https://github.com/microsoft-search/pnp-modern-search-extensibility-samples/tree/main)
[PNP V4 Search Web Parts](https://microsoft-search.github.io/pnp-modern-search/extensibility/)

## About

The current extension includes the handlebars helper #group operator. For example assume you had a list of people - and you wanted to group them by last name.

```
    {{#group data.items by="LastName"}}
        {{value}}
        {{#each items}}

        {{/each}}
    {{/group}}
```

Each "lastName" found would be provided in the {{value}} tag - while the list of specific users would become available in the items array. the group helper [handlebars-group-by](https://github.com/shannonmoeller/handlebars-group-by)

This extension project contains the group operator that has been removed from the v4 web parts.
