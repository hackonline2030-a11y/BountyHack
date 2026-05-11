const nx = require("@nx/eslint-plugin");

module.exports = [
    ...nx.configs["flat/base"],
    ...nx.configs["flat/typescript"],
    ...nx.configs["flat/javascript"],
    {
        ignores: [
            "**/dist"
        ]
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.js",
            "**/*.jsx",
            "**/*.cjs",
            "**/*.mjs"
        ],
        // Override or add rules here
        rules: {}
    },
    // Namespaces used on purpose (Prisma mock, Mongo schema grouping, API contract grouping).
    {
        files: [
            "src/test/mocks/prisma-generated-client.ts",
            "src/users/adapters/mongo/mongo-user.ts",
            "src/users/contract.ts",
            "src/auth/adapters/passport-jwt/repositories/mongo/mongo-refresh-token.ts",
        ],
        rules: {
            "@typescript-eslint/no-namespace": "off",
        },
    },
];
