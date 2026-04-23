import { type FormEvent, useState } from "react";
import {
  CreateResourceResourceType,
  getGetResourcesQueryKey,
  useDeleteResourcesId,
  useGetResources,
  usePatchResourcesId,
  usePostResources,
  type GetResourcesParams,
  type GetResourcesResourceType,
  type Resource,
} from "./api";
import { useQueryClient } from "@tanstack/react-query";

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  general: "General",
  room: "Room",
  equipment: "Equipment",
  vehicle: "Vehicle",
  person: "Person",
};

type EditState = {
  id: number;
  title: string;
  description: string;
  resourceType: string;
};

export default function App() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<string>("general");
  const [editState, setEditState] = useState<EditState | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<GetResourcesResourceType | "">("");

  const trimmedSearch = search.trim();
  const queryParams: GetResourcesParams = {
    ...(trimmedSearch ? { search: trimmedSearch } : {}),
    ...(filterType ? { resourceType: filterType } : {}),
  };

  const queryClient = useQueryClient();
  const refreshResources = () =>
    queryClient.invalidateQueries({ queryKey: getGetResourcesQueryKey() });

  const resourcesQuery = useGetResources(queryParams);

  const createMutation = usePostResources({
    mutation: {
      onSuccess: async () => {
        setTitle("");
        setDescription("");
        setResourceType("general");
        await refreshResources();
      },
    },
  });

  const updateMutation = usePatchResourcesId({
    mutation: {
      onSuccess: async () => {
        setEditState(null);
        await refreshResources();
      },
    },
  });

  const deleteMutation = useDeleteResourcesId({
    mutation: {
      onSuccess: refreshResources,
    },
  });

  const trimmedTitle = title.trim();
  const resources = resourcesQuery.data?.resources ?? [];
  const deletingId = deleteMutation.variables?.id;

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedTitle || createMutation.isPending) return;

    createMutation.mutate({
      data: {
        title: trimmedTitle,
        description: description.trim(),
        resourceType: resourceType as "general" | "room" | "equipment" | "vehicle" | "person",
      },
    });
  };

  const handleEditOpen = (resource: Resource) => {
    setEditState({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      resourceType: resource.resourceType,
    });
  };

  const handleEditSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editState || updateMutation.isPending) return;

    const trimmed = editState.title.trim();
    if (!trimmed) return;

    updateMutation.mutate({
      id: editState.id,
      data: {
        title: trimmed,
        description: editState.description.trim(),
        resourceType: editState.resourceType as "general" | "room" | "equipment" | "vehicle" | "person",
      },
    });
  };

  const handleRemove = (id: number) => {
    if (deleteMutation.isPending) return;
    deleteMutation.mutate({ id });
  };

  const resourceTypes = Object.values(CreateResourceResourceType);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Resources</h1>
          <p className="text-sm text-slate-600">
            Manage bookable resources. Add, edit, or remove entries below.
          </p>
        </header>

        <form
          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          onSubmit={handleCreate}
        >
          <div className="flex gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resource name"
              maxLength={120}
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-slate-500"
            />
            <select
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            >
              {resourceTypes.map((t) => (
                <option key={t} value={t}>
                  {RESOURCE_TYPE_LABELS[t] ?? t}
                </option>
              ))}
            </select>
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            maxLength={500}
            className="rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-slate-500"
          />
          <button
            type="submit"
            disabled={!trimmedTitle || createMutation.isPending}
            className="self-end rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {createMutation.isPending ? "Adding..." : "Add resource"}
          </button>
        </form>

        {createMutation.isError ? (
          <p className="text-sm text-rose-600">
            Could not add the resource: {createMutation.error.message}
          </p>
        ) : null}

        {deleteMutation.isError ? (
          <p className="text-sm text-rose-600">
            Could not remove the resource: {deleteMutation.error.message}
          </p>
        ) : null}

        {updateMutation.isError ? (
          <p className="text-sm text-rose-600">
            Could not update the resource: {updateMutation.error.message}
          </p>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-slate-700">All resources</h2>
            {trimmedSearch || filterType ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterType("");
                }}
                className="text-xs text-slate-500 underline-offset-2 hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description"
              maxLength={120}
              className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
            />
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as GetResourcesResourceType | "")
              }
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-500"
            >
              <option value="">All types</option>
              {resourceTypes.map((t) => (
                <option key={t} value={t}>
                  {RESOURCE_TYPE_LABELS[t] ?? t}
                </option>
              ))}
            </select>
          </div>

          {resourcesQuery.isPending ? (
            <p className="mt-3 text-sm text-slate-600">Loading resources...</p>
          ) : null}

          {resourcesQuery.isError ? (
            <p className="mt-3 text-sm text-rose-600">
              Could not load resources: {resourcesQuery.error.message}
            </p>
          ) : null}

          {!resourcesQuery.isPending && !resourcesQuery.isError ? (
            resources.length > 0 ? (
              <ul className="mt-3 divide-y divide-slate-200">
                {resources.map((resource) =>
                  editState?.id === resource.id ? (
                    <li key={resource.id} className="py-3">
                      <form className="flex flex-col gap-2" onSubmit={handleEditSave}>
                        <div className="flex gap-2">
                          <input
                            value={editState.title}
                            onChange={(e) =>
                              setEditState({ ...editState, title: e.target.value })
                            }
                            maxLength={120}
                            className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
                          />
                          <select
                            value={editState.resourceType}
                            onChange={(e) =>
                              setEditState({ ...editState, resourceType: e.target.value })
                            }
                            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-500"
                          >
                            {resourceTypes.map((t) => (
                              <option key={t} value={t}>
                                {RESOURCE_TYPE_LABELS[t] ?? t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          value={editState.description}
                          onChange={(e) =>
                            setEditState({ ...editState, description: e.target.value })
                          }
                          maxLength={500}
                          placeholder="Description (optional)"
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditState(null)}
                            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!editState.title.trim() || updateMutation.isPending}
                            className="rounded-md bg-slate-900 px-3 py-1 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            {updateMutation.isPending ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </form>
                    </li>
                  ) : (
                    <li key={resource.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{resource.title}</span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                            {RESOURCE_TYPE_LABELS[resource.resourceType] ?? resource.resourceType}
                          </span>
                        </div>
                        {resource.description ? (
                          <p className="mt-0.5 truncate text-sm text-slate-500">
                            {resource.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditOpen(resource)}
                          className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(resource.id)}
                          disabled={deleteMutation.isPending}
                          className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                          {deleteMutation.isPending && deletingId === resource.id
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                {trimmedSearch || filterType
                  ? "No resources match the current filters."
                  : "No resources yet."}
              </p>
            )
          ) : null}
        </section>
      </div>
    </main>
  );
}
