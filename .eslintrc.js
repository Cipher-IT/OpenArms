{
  "env": {
      "es2021": true,
      "node": true
  },
  "extends": [
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
      "ecmaVersion": "latest",
      "sourceType": "module"
  },
  "plugins": [
      "@typescript-eslint",
      "unused-imports"
  ],
  "rules": {
      "indent": [
          "error",
          4, 
          { "SwitchCase": 1, "ignoredNodes": ["FunctionExpression > .params[decorators.length > 0]","FunctionExpression > .params > :matches(Decorator, :not(:first-child))","ClassBody.body > PropertyDefinition[decorators.length > 0] > .key"] }
      ],
      "quotes": [
          "error",
          "single"
      ],
      "semi": [
          "error",
          "always"
      ],
      "require-await":"warn",
      "space-before-blocks":"error",
      "comma-spacing":"warn",
      "no-empty-function":"off",
      "no-empty":"off",
      "no-multiple-empty-lines": [2,{"max":1}],
      "no-var": "error",
      "no-console": "error",
      "no-case-declarations":["off"],
      "@typescript-eslint/no-empty-function":"off",
      "@typescript-eslint/no-unused-vars": ["off"],
      "@typescript-eslint/no-explicit-any":["off"],
      "@typescript-eslint/type-annotation-spacing":["warn"],
      "@typescript-eslint/explicit-function-return-type":["error"],
      "@typescript-eslint/naming-convention": [
          "error",
          { "selector": "variable", "format": ["camelCase"] },
          { "selector": "function", "format": ["PascalCase", "camelCase"] },
          { "selector": "classProperty", "format": ["PascalCase", "camelCase"] },
          { "selector": "parameter", "format": ["camelCase"], "leadingUnderscore": "allow" },
          { "selector": "enumMember", "format": ["UPPER_CASE"] },
          { "selector": "classMethod", "format": ["camelCase"], "leadingUnderscore": "allow","custom": {
              "regex": "^[a-z]+[a-zA-Z0-9]*$",
              "match": true
            } }
        ],
        "unused-imports/no-unused-imports": "error"
  }
}
