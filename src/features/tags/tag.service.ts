import { createTagSchema } from './tag.validation';
import { tagRepository } from './tag.repository';
import type { Tag, TagWithCount } from './tag.types';

export class TagServiceError extends Error {
  constructor(message: string, public readonly fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'TagServiceError';
  }
}

class TagService {
  async getAllTags(): Promise<TagWithCount[]> {
    return tagRepository.findAll();
  }

  async createTag(rawInput: unknown): Promise<Tag> {
    const parsed = createTagSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path.join('.')] = issue.message;
      }
      throw new TagServiceError('The tag details are invalid.', fieldErrors);
    }

    const existing = await tagRepository.findByName(parsed.data.name);
    if (existing) {
      throw new TagServiceError('A tag with this name already exists.');
    }

    try {
      return await tagRepository.create(parsed.data);
    } catch {
      throw new TagServiceError('Could not save the tag. Please try again.');
    }
  }

  async deleteTag(id: string): Promise<{ itemCount: number }> {
    const itemCount = await tagRepository.countItemsUsingTag(id);

    try {
      await tagRepository.delete(id);
      return { itemCount };
    } catch {
      throw new TagServiceError('Could not delete the tag. Please try again.');
    }
  }

  async renameTag(id: string, input: unknown): Promise<Tag> {
    const parsed = createTagSchema.safeParse(input);
    if (!parsed.success) throw new TagServiceError('Enter a valid tag name.');
    const existing = await tagRepository.findByName(parsed.data.name);
    if (existing && existing.id !== id) throw new TagServiceError('A tag with this name already exists.');
    try { return await tagRepository.rename(id, parsed.data.name); }
    catch { throw new TagServiceError('Could not rename the tag. Please try again.'); }
  }
}

export const tagService = new TagService();
