import React, { useState } from 'react';
import { useParameter } from '../contexts/ParameterContext';
import type { Node } from 'reactflow';

export interface ParameterSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  nodes: Node[];
}

function ParameterTable() {
  const {
    parameters,
    validationErrors,
    updateParameter,
    deleteParameter,
    addParameter,
  } = useParameter();

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este parâmetro?')) {
      deleteParameter(id);
    }
  };

  return (
    <div>
      <button
        style={{ marginBottom: 12, width: '100%' }}
        onClick={addParameter}
        data-testid="add-parameter"
      >
        + Adicionar Parâmetro
      </button>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: 4 }}>Nome</th>
            <th style={{ textAlign: 'left', padding: 4 }}>Valor</th>
            <th style={{ textAlign: 'left', padding: 4 }}>Descrição</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {parameters.map(param => (
            <tr key={param.id}>
              <td style={{ padding: 4 }}>
                <input
                  style={{
                    width: '90%',
                    border: validationErrors[param.id]?.name ? '1px solid red' : '1px solid #ccc',
                    borderRadius: 4,
                    padding: 2,
                  }}
                  value={param.name}
                  onChange={e => updateParameter(param.id, 'name', e.target.value)}
                  data-testid={`name-input-${param.id}`}
                />
                {validationErrors[param.id]?.name && (
                  <div style={{ color: 'red', fontSize: 12 }} data-testid={`name-error-${param.id}`}>
                    {validationErrors[param.id].name}
                  </div>
                )}
              </td>
              <td style={{ padding: 4 }}>
                <input
                  style={{
                    width: '90%',
                    border: validationErrors[param.id]?.value ? '1px solid red' : '1px solid #ccc',
                    borderRadius: 4,
                    padding: 2,
                  }}
                  value={param.value}
                  onChange={e => updateParameter(param.id, 'value', e.target.value)}
                  data-testid={`value-input-${param.id}`}
                />
                {validationErrors[param.id]?.value && (
                  <div style={{ color: 'red', fontSize: 12 }} data-testid={`value-error-${param.id}`}>
                    {validationErrors[param.id].value}
                  </div>
                )}
              </td>
              <td style={{ padding: 4 }}>
                <input
                  style={{ width: '90%', border: '1px solid #ccc', borderRadius: 4, padding: 2 }}
                  value={param.description}
                  onChange={e => updateParameter(param.id, 'description', e.target.value)}
                  data-testid={`description-input-${param.id}`}
                />
              </td>
              <td style={{ padding: 4 }}>
                <button
                  style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}
                  onClick={() => handleDelete(param.id)}
                  data-testid={`delete-${param.id}`}
                  title="Deletar parâmetro"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ParameterSidebar({ isOpen, onToggle, nodes }: ParameterSidebarProps) {
  const { checkNodeReferences } = useParameter();
  const [showWarning, setShowWarning] = useState(false);
  const refCheck = checkNodeReferences(nodes);
  const hasUndefined = !refCheck.valid && refCheck.undefinedParams.length > 0;

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        right: isOpen ? 0 : -350,
        width: 350,
        height: '100%',
        background: '#fff',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.08)',
        transition: 'right 0.3s',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
      }}
      aria-label="Parameter Sidebar"
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eee' }}>
        <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}>
          Parâmetros
          {hasUndefined && (
            <span
              style={{ color: 'orange', marginLeft: 8, cursor: 'pointer', fontSize: 20 }}
              title="Parâmetros não definidos referenciados em nós"
              onClick={() => setShowWarning(w => !w)}
              data-testid="undefined-params-warning"
            >
              ⚠️
            </span>
          )}
        </h2>
        <button onClick={onToggle} aria-label={isOpen ? 'Fechar barra de parâmetros' : 'Abrir barra de parâmetros'}>
          {isOpen ? '→' : '←'}
        </button>
      </header>
      {showWarning && hasUndefined && (
        <div style={{ background: '#fffbe6', color: '#ad6800', padding: '0.75rem 1rem', borderBottom: '1px solid #ffe58f' }}>
          <strong>Parâmetros não definidos:</strong>
          <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0 }}>
            {refCheck.undefinedParams.map(param => (
              <li key={param}>{param}</li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        <ParameterTable />
      </div>
    </aside>
  );
} 