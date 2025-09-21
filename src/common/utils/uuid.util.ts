import z from 'zod';

export function isValidUUID(uuid: string): boolean {
  const schema = z.uuid();
  return schema.safeParse(uuid).success;
}
