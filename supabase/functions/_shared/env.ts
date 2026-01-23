export interface EnvConfig {
  required: string[];
  optional?: string[];
}

export class EnvValidator {
  static validate(config: EnvConfig): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const key of config.required) {
      const value = Deno.env.get(key);
      if (!value || value.trim() === '') {
        missing.push(key);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  static getRequired(key: string): string {
    const value = Deno.env.get(key);
    if (!value || value.trim() === '') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  static getOptional(key: string, defaultValue: string = ''): string {
    return Deno.env.get(key) || defaultValue;
  }
}
