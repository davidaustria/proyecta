import { useForm, type InertiaFormProps } from '@inertiajs/react';

/**
 * Type for Wayfinder route objects
 */
type WayfinderRoute = {
    url: string;
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
};

/**
 * Options for useInertiaForm
 */
type UseInertiaFormOptions<TForm> = {
    /**
     * Initial form data
     */
    initialValues?: TForm;
    /**
     * Preserve scroll position on submit
     */
    preserveScroll?: boolean;
    /**
     * Preserve state on submit
     */
    preserveState?: boolean;
    /**
     * Reset form on success
     */
    resetOnSuccess?: boolean;
    /**
     * Callback fired on success
     */
    onSuccess?: (page: unknown) => void;
    /**
     * Callback fired on error
     */
    onError?: (errors: Record<string, string>) => void;
    /**
     * Callback fired on finish (regardless of success or error)
     */
    onFinish?: () => void;
};

/**
 * Custom hook that wraps Inertia's useForm with Wayfinder integration
 *
 * @example
 * ```tsx
 * import { store } from '@/actions/App/Http/Controllers/CustomerController';
 *
 * const { data, setData, submit, processing, errors } = useInertiaForm({
 *   initialValues: { name: '', code: '' }
 * });
 *
 * const handleSubmit = (e: FormEvent) => {
 *   e.preventDefault();
 *   submit(store());
 * };
 * ```
 */
export function useInertiaForm<
    TForm extends Record<string, unknown> = Record<string, unknown>,
>(options: UseInertiaFormOptions<TForm> = {}) {
    const {
        initialValues = {} as TForm,
        preserveScroll = false,
        preserveState = false,
        resetOnSuccess = false,
        onSuccess,
        onError,
        onFinish,
    } = options;

    const form = useForm<TForm>(initialValues);

    /**
     * Submit the form to a Wayfinder route or URL string
     */
    const submit = (
        route: WayfinderRoute | string,
        submitOptions?: Partial<InertiaFormProps<TForm>>,
    ) => {
        const url = typeof route === 'string' ? route : route.url;
        const method = typeof route === 'string' ? 'post' : route.method;

        const defaultOptions: Partial<InertiaFormProps<TForm>> = {
            preserveScroll,
            preserveState,
            onSuccess: (page) => {
                if (resetOnSuccess) {
                    form.reset();
                }
                onSuccess?.(page);
            },
            onError: (errors) => {
                onError?.(errors);
            },
            onFinish: () => {
                onFinish?.();
            },
        };

        const options = { ...defaultOptions, ...submitOptions };

        form.submit(method, url, options);
    };

    /**
     * Submit the form with GET method
     */
    const submitGet = (
        route: WayfinderRoute | string,
        submitOptions?: Partial<InertiaFormProps<TForm>>,
    ) => {
        const url = typeof route === 'string' ? route : route.url;
        form.get(url, submitOptions);
    };

    /**
     * Submit the form with POST method
     */
    const submitPost = (
        route: WayfinderRoute | string,
        submitOptions?: Partial<InertiaFormProps<TForm>>,
    ) => {
        const url = typeof route === 'string' ? route : route.url;
        form.post(url, submitOptions);
    };

    /**
     * Submit the form with PUT method
     */
    const submitPut = (
        route: WayfinderRoute | string,
        submitOptions?: Partial<InertiaFormProps<TForm>>,
    ) => {
        const url = typeof route === 'string' ? route : route.url;
        form.put(url, submitOptions);
    };

    /**
     * Submit the form with PATCH method
     */
    const submitPatch = (
        route: WayfinderRoute | string,
        submitOptions?: Partial<InertiaFormProps<TForm>>,
    ) => {
        const url = typeof route === 'string' ? route : route.url;
        form.patch(url, submitOptions);
    };

    /**
     * Submit the form with DELETE method
     */
    const submitDelete = (
        route: WayfinderRoute | string,
        submitOptions?: Partial<InertiaFormProps<TForm>>,
    ) => {
        const url = typeof route === 'string' ? route : route.url;
        form.delete(url, submitOptions);
    };

    return {
        ...form,
        submit,
        submitGet,
        submitPost,
        submitPut,
        submitPatch,
        submitDelete,
    };
}
