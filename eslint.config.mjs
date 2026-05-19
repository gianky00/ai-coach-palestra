import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import sonarjs from "eslint-plugin-sonarjs";
import security from "eslint-plugin-security";
import jsdoc from "eslint-plugin-jsdoc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    {
        ignores: ["**/node_modules/", "**/.clasp.json"],
    },
    ...compat.extends("eslint:recommended"),
    sonarjs.configs.recommended,
    security.configs.recommended,
    jsdoc.configs['flat/recommended'],
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                SpreadsheetApp: "readonly",
                CacheService: "readonly",
                HtmlService: "readonly",
                Utilities: "readonly",
                Sheets: "readonly",
                Logger: "readonly",
                google: "readonly",
            },
            ecmaVersion: "latest",
            sourceType: "module",
        },
        rules: {
            "no-var": "off",
            "no-unused-vars": "off", // Disattivato per funzioni globali Apps Script (entry points)
            "sonarjs/cognitive-complexity": ["error", 15],
            "sonarjs/no-duplicate-string": "warn",
            "sonarjs/no-ignored-exceptions": "warn",
            "security/detect-object-injection": "off",
            "jsdoc/require-param-description": "warn",
            "jsdoc/require-returns-description": "warn",
            "jsdoc/require-jsdoc": ["warn", {
                "publicOnly": false,
                "require": {
                    "FunctionDeclaration": true,
                    "MethodDefinition": true,
                    "ClassDeclaration": true
                }
            }]
        },
    },
];
