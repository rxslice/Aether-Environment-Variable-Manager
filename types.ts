export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  type: VariableType;
}

export interface Profile {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

export interface Project {
  id: string;
  name: string;
  profiles: Profile[];
  activeProfileId: string;
}

export enum VariableType {
  TEXT = 'TEXT',
  URL = 'URL',
  EMAIL = 'EMAIL',
  JWT = 'JWT',
  AWS_KEY = 'AWS_KEY',
  GENERIC_SECRET = 'GENERIC_SECRET',
}