export function toSlug(input:string):string {
    return input.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g, '');
   }