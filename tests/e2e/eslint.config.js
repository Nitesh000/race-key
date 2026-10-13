import base from "@race-key/config/eslint/base";

export default [...base, { ignores: ["playwright-report/**", "test-results/**"] }];
