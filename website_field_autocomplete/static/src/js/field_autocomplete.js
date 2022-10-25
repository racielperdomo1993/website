/* Copyright 2016 LasLabs Inc.
 * License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
 */

odoo.define("website_field_autocomplete.field_autocomplete", function (require) {
    "use strict";

    const publicWidget = require("web.public.widget");

    publicWidget.registry.field_autocomplete = publicWidget.Widget.extend({
        selector: ".js_website_autocomplete",

        /* Query remote server for autocomplete suggestions
         * @param request object Request from jQueryUI Autocomplete
         * @param response function Callback for response, accepts array of str
         */
        autocomplete: function (request, response) {
            let domain = [[this.queryField, "ilike", request.term]];
            if (this.add_domain) {
                domain = domain.concat(this.add_domain);
            }
            return $.ajax({
                dataType: "json",
                url: "/website/field_autocomplete/" + this.model,
                contentType: "application/json; charset=utf-8",
                type: "POST",
                data: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "call",
                    params: {domain: domain, fields: this.fields, limit: this.limit},
                }),
            }).then((records) => {
                const data = records.result.reduce((a, b) => {
                    a.push({label: b[this.displayField], value: b[this.valueField]});
                    return a;
                }, []);
                response(data);
                return records;
            });
        },

        /* Return arguments that are used to initialize autocomplete */
        autocompleteArgs: function () {
            const self = this;
            return {
                source: (request, response) => {
                    this.autocomplete(request, response);
                },
                focus: function (event, ui) {
                    self.$target.val(ui.item.label);
                    self.many2oneCompatibility(ui.item);
                    return false;
                },
                select: function (event, ui) {
                    self.$target.val(ui.item.label);
                    self.many2oneCompatibility(ui.item);
                    return false;
                },
            };
        },

        start: function () {
            this.model = this.$target.data("model");
            this.queryField = this.$target.data("query-field") || "name";
            this.displayField = this.$target.data("display-field") || this.queryField;
            this.field = this.$target.data("field") || this.field;
            this.valueField = this.$target.data("value-field") || this.displayField;
            this.limit = this.$target.data("limit") || 10;
            this.add_domain = this.$target.data("domain");
            this.fields = [this.displayField];
            if (this.valueField != this.displayField) {
                this.fields.push(this.valueField);
            }
            this.$target.autocomplete(this.autocompleteArgs());
            return this._super(...arguments);
        },

        many2oneCompatibility: function (item) {
            if (!this.field) return;
            let formField = $(this.el.closest("form")).find(
                `input[name='${this.field}']`
            );
            if (!formField.length) {
                formField = $(this.el.closest("form")).append(
                    `<input class="d-none" name='${this.field}' />`
                );
            }
            formField.val(item.value);
        },
    });
});
