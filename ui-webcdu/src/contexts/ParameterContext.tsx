import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Parameter interface
export interface Parameter {
    id: string;
    name: string;  // Must start with # and be exactly 6 chars
    value: string;
    description: string;
}

// Parameter context state
export interface ParameterContextState {
    parameters: Parameter[];
    validationErrors: Record<string, Record<keyof Parameter, string | undefined>>;
}

// Parameter context type
export interface ParameterContextType extends ParameterContextState {
    addParameter: () => void;
    updateParameter: (id: string, field: keyof Parameter, value: string) => void;
    deleteParameter: (id: string) => void;
    validateParameter: (parameter: Parameter) => { valid: boolean; error?: string };
    checkNodeReferences: (nodes?: any[]) => { valid: boolean; undefinedParams: string[] };
    getParameterByName: (name: string) => Parameter | undefined;
    clearParameters: () => void;
    importParameters: (parameters: Parameter[]) => void;
    exportParameters: () => Parameter[];
}

// Initial state
const initialState: ParameterContextState = {
    parameters: [],
    validationErrors: {},
};

// Action types
type ParameterAction =
    | { type: 'ADD_PARAMETER'; payload: Parameter }
    | { type: 'UPDATE_PARAMETER'; payload: { id: string; field: keyof Parameter; value: string } }
    | { type: 'DELETE_PARAMETER'; payload: string }
    | { type: 'SET_VALIDATION_ERROR'; payload: { id: string; field: keyof Parameter; error: string | undefined } }
    | { type: 'CLEAR_PARAMETERS' }
    | { type: 'IMPORT_PARAMETERS'; payload: Parameter[] };

// Reducer function
function parameterReducer(state: ParameterContextState, action: ParameterAction): ParameterContextState {
    switch (action.type) {
        case 'ADD_PARAMETER': {
            return {
                ...state,
                parameters: [...state.parameters, action.payload],
            };
        }

        case 'UPDATE_PARAMETER': {
            const { id, field, value } = action.payload;
            return {
                ...state,
                parameters: state.parameters.map(param =>
                    param.id === id ? { ...param, [field]: value } : param
                ),
            };
        }

        case 'DELETE_PARAMETER': {
            // Remove the deleted parameter's validation errors
            const { [action.payload]: _removed, ...restErrors } = state.validationErrors;
            return {
                ...state,
                parameters: state.parameters.filter(param => param.id !== action.payload),
                validationErrors: restErrors,
            };
        }

        case 'SET_VALIDATION_ERROR': {
            const { id, field, error } = action.payload;
            return {
                ...state,
                validationErrors: {
                    ...state.validationErrors,
                    [id]: {
                        ...(state.validationErrors[id] || {}),
                        [field]: error,
                    },
                },
            };
        }

        case 'CLEAR_PARAMETERS': {
            return {
                ...state,
                parameters: [],
                validationErrors: {},
            };
        }

        case 'IMPORT_PARAMETERS': {
            return {
                ...state,
                parameters: action.payload,
                validationErrors: {},
            };
        }

        default:
            return state;
    }
}

// Create context
const ParameterContext = createContext<ParameterContextType | undefined>(undefined);

// Provider component
export function ParameterProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(parameterReducer, initialState);

    // Generate a unique ID for a new parameter
    const generateUniqueId = useCallback((): string => {
        const existingIds = new Set(state.parameters.map(param => param.id));
        let id = 1;
        while (existingIds.has(`p${id}`)) {
            id++;
        }
        return `p${id}`;
    }, [state.parameters]);

    // Add a new parameter
    const addParameter = useCallback(() => {
        const id = generateUniqueId();
        const newParameter: Parameter = {
            id,
            name: '#',
            value: '',
            description: '',
        };
        dispatch({ type: 'ADD_PARAMETER', payload: newParameter });
    }, [generateUniqueId]);

    // Update a parameter
    const updateParameter = useCallback((id: string, field: keyof Parameter, value: string) => {
        dispatch({ type: 'UPDATE_PARAMETER', payload: { id, field, value } });

        // Validate the updated parameter
        const updatedParam = state.parameters.find(p => p.id === id);
        if (updatedParam) {
            const updatedParameter = { ...updatedParam, [field]: value };
            const validationResult = validateParameterField(updatedParameter, field, state.parameters);

            dispatch({
                type: 'SET_VALIDATION_ERROR',
                payload: { id, field, error: validationResult.error },
            });
        }
    }, [state.parameters]);

    // Delete a parameter
    const deleteParameter = useCallback((id: string) => {
        dispatch({ type: 'DELETE_PARAMETER', payload: id });
    }, []);

    // Clear all parameters
    const clearParameters = useCallback(() => {
        dispatch({ type: 'CLEAR_PARAMETERS' });
    }, []);

    // Import parameters
    const importParameters = useCallback((parameters: Parameter[]) => {
        dispatch({ type: 'IMPORT_PARAMETERS', payload: parameters });
    }, []);

    // Export parameters
    const exportParameters = useCallback((): Parameter[] => {
        return state.parameters;
    }, [state.parameters]);

    // Validate a parameter field
    const validateParameterField = useCallback((
        parameter: Parameter,
        field: keyof Parameter,
        allParameters: Parameter[]
    ): { valid: boolean; error?: string } => {
        if (field === 'name') {
            // Name must start with # and be exactly 6 characters
            if (!parameter.name.startsWith('#')) {
                return { valid: false, error: 'Nome deve começar com #' };
            }

            if (parameter.name.length > 6) {
                return { valid: false, error: 'Nome deve ter no máximo 6 caracteres' };
            }

            // Check for duplicate names
            const duplicates = allParameters.filter(
                p => p.name === parameter.name && p.id !== parameter.id
            );

            if (duplicates.length > 0) {
                return { valid: false, error: 'Nome deve ser único' };
            }
        }

        if (field === 'value') {
            // Value must not be empty
            if (!parameter.value.trim()) {
                return { valid: false, error: 'Valor não pode ser vazio' };
            }
        }

        return { valid: true };
    }, []);

    // Validate an entire parameter
    const validateParameter = useCallback((parameter: Parameter): { valid: boolean; error?: string } => {
        // Validate name
        const nameValidation = validateParameterField(parameter, 'name', state.parameters);
        if (!nameValidation.valid) {
            return nameValidation;
        }

        // Validate value
        const valueValidation = validateParameterField(parameter, 'value', state.parameters);
        if (!valueValidation.valid) {
            return valueValidation;
        }

        return { valid: true };
    }, [state.parameters, validateParameterField]);

    // Check if all referenced parameters exist
    const checkNodeReferences = useCallback((nodes?: any[]) => {
        const undefinedParams: string[] = [];

        if (nodes && nodes.length > 0) {
            // List of parameter keys to check
            const paramKeys = ['P1', 'P2', 'P3', 'P4'];
            const undefinedParamSet = new Set<string>();

            nodes.forEach(node => {
                if (node.data) {
                    paramKeys.forEach(key => {
                        const paramValue = node.data[key];
                        if (paramValue && typeof paramValue === 'string') {
                            // Parameter names must start with # and be 6 chars
                            // Only check if the value looks like a parameter reference
                            if (paramValue.startsWith('#') && paramValue.length === 6) {
                                const paramExists = state.parameters.some(p => p.name === paramValue);
                                if (!paramExists) {
                                    undefinedParamSet.add(paramValue);
                                }
                            }
                        }
                    });
                }
            });

            undefinedParams.push(...Array.from(undefinedParamSet));
        }

        return {
            valid: undefinedParams.length === 0,
            undefinedParams,
        };
    }, [state.parameters]);

    // Get a parameter by name
    const getParameterByName = useCallback((name: string): Parameter | undefined => {
        return state.parameters.find(param => param.name === name);
    }, [state.parameters]);

    // Context value
    const contextValue: ParameterContextType = {
        ...state,
        addParameter,
        updateParameter,
        deleteParameter,
        validateParameter,
        checkNodeReferences,
        getParameterByName,
        clearParameters,
        importParameters,
        exportParameters,
    };

    return (
        <ParameterContext.Provider value={contextValue}>
            {children}
        </ParameterContext.Provider>
    );
}

// Custom hook to use the parameter context
export function useParameter(): ParameterContextType {
    const context = useContext(ParameterContext);
    if (context === undefined) {
        throw new Error('useParameter must be used within a ParameterProvider');
    }
    return context;
}