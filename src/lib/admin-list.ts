import type { ProjectForm } from './project-form';

export const emptyProjectSearch = {
  keyword: '',
  originCode: '',
  typeCode: '',
  visibility: '',
};
export const emptyBoardSearch = { keyword: '', category: '', status: '' };

export function matchesProject(
  project: ProjectForm,
  search: typeof emptyProjectSearch,
) {
  const text = [
    project.slug,
    project.customerName,
    project.translations.ko.title,
    project.translations.en.title,
    project.translations.ko.summary,
    project.translations.en.summary,
    ...project.technologies,
    ...project.tags,
  ]
    .join(' ')
    .toLowerCase();
  return (
    text.includes(search.keyword.trim().toLowerCase()) &&
    (!search.originCode || project.originCode === search.originCode) &&
    (!search.typeCode ||
      (search.typeCode === '__unset__'
        ? !project.typeCode
        : project.typeCode === search.typeCode)) &&
    (!search.visibility || project.visibility === search.visibility)
  );
}

export function matchesBoard(
  entry: {
    title: string;
    slug: string;
    summary: string;
    body: string;
    category: string;
    status: string;
  },
  search: typeof emptyBoardSearch,
) {
  return (
    [entry.title, entry.slug, entry.summary, entry.body]
      .join(' ')
      .toLowerCase()
      .includes(search.keyword.trim().toLowerCase()) &&
    (!search.category || entry.category === search.category) &&
    (!search.status || entry.status === search.status)
  );
}

export function paginate<T>(
  items: T[],
  requestedPage: number,
  pageSize: number,
) {
  const size = Number.isInteger(pageSize) && pageSize > 0 ? pageSize : 10;
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.max(
    1,
    Math.min(totalPages, Number.isInteger(requestedPage) ? requestedPage : 1),
  );
  return {
    page,
    totalPages,
    items: items.slice((page - 1) * size, page * size),
  };
}
