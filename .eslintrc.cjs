module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: [`prettier`],
    parser: `@typescript-eslint/parser`,
    parserOptions: {
        ecmaVersion: `latest`,
        sourceType: `module`,
    },
    plugins: [`@typescript-eslint`, `jsdoc`, `import`],
    rules: {
        quotes: [`error`, `backtick`],
        "no-unused-vars": [`warn`],
        "@typescript-eslint/no-unused-vars": [`warn`],
        "import/extensions": [
            `error`,
            `ignorePackages`,
            {
                js: `always`,
            },
        ],
    },
};
