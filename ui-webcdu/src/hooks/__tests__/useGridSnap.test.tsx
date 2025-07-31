import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { useGridSnap } from '../useGridSnap';
import type { Node } from 'reactflow';

// Mock setNodes function for testing
const mockSetNodes = vi.fn();

describe('useGridSnap', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ReactFlowProvider>{children}</ReactFlowProvider>
    );

    describe('initialization', () => {
        it('should initialize with default configuration', () => {
            const { result } = renderHook(() => useGridSnap(), { wrapper });

            expect(result.current.config).toEqual({
                size: 20,
                enabled: false,
                showOverlay: false,
                snapThreshold: 10,
            });
            expect(result.current.isEnabled).toBe(false);
            expect(result.current.showOverlay).toBe(false);
            expect(result.current.gridSize).toBe(20);
        });

        it('should initialize with custom configuration', () => {
            const initialConfig = { size: 30, enabled: true };
            const { result } = renderHook(() => useGridSnap(initialConfig), { wrapper });

            expect(result.current.config.size).toBe(30);
            expect(result.current.config.enabled).toBe(true);
            expect(result.current.isEnabled).toBe(true);
            expect(result.current.gridSize).toBe(30);
        });

        it('should provide access to controller and position manager', () => {
            const { result } = renderHook(() => useGridSnap(), { wrapper });

            expect(result.current.controller).toBeDefined();
            expect(result.current.positionManager).toBeDefined();
            expect(typeof result.current.controller.toggleGridSnap).toBe('function');
            expect(typeof result.current.positionManager.snapToGrid).toBe('function');
        });
    });

    describe('grid snapping controls', () => {
        it('should toggle grid snapping', () => {
            const { result } = renderHook(() => useGridSnap(), { wrapper });

            expect(result.current.isEnabled).toBe(false);

            act(() => {
                result.current.toggleGridSnap();
            });

            expect(result.current.isEnabled).toBe(true);
            expect(result.current.showOverlay).toBe(true);
        });

        it('should enable grid snapping', () => {
            const { result } = renderHook(() => useGridSnap(), { wrapper });

            act(() => {
                result.current.enableGridSnap();
            });

            expect(result.current.isEnabled).toBe(true);
            expect(result.current.showOverlay).toBe(true);
        });

        it('should disable grid snapping', () => {
            const { result } = renderHook(() => useGridSnap({ enabled: true }), { wrapper });

            expect(result.current.isEnabled).toBe(true);

            act(() => {
                result.current.disableGridSnap();
            });

            expect(result.current.isEnabled).toBe(false);
            expect(result.current.showOverlay).toBe(false);
        });

        it('should update configuration', () => {
            const { result } = renderHook(() => useGridSnap(), { wrapper });

            act(() => {
                result.current.updateConfig({ size: 40, snapThreshold: 15 });
            });

            expect(result.current.config.size).toBe(40);
            expect(result.current.config.snapThreshold).toBe(15);
            expect(result.current.gridSize).toBe(40);
        });
    });

    describe('existing nodes snapping', () => {
        it('should snap existing nodes to grid', () => {
            const nodes: Node[] = [
                {
                    id: '1',
                    type: 'default',
                    position: { x: 15, y: 25 },
                    data: {},
                },
                {
                    id: '2',
                    type: 'default',
                    position: { x: 35, y: 45 },
                    data: {},
                },
            ];

            const { result } = renderHook(() => apper });

            act(() => {
;
            });

            exp
    {
                    id: '1',
                 ult',
                    position, y: 20 },
                    data: {},
                },
                {
                  '2',
                 
                    position: 40 },
                    data: {},
                },
            ]);
        });

        it( () => {


            const { result } = renderHook(() ;

            act(() => {
es);
            });

            exp);
   });

        it( () => {

                {
                    id: '1',
                 ,
                    position y: 25 },
                    data: {},
                },
            ];

            //arning
);

);

            act(() => {
es);
            });

            expect(consbled');
            expect(mockSetNodes).not.toHaveBeenCall

);
        });
    });

    describe('state synchronization', => {
        it( {
       

            expect(result.current.isEnabled).;

            // Directly call controller method to test subscription
) => {
                result.current.controller.enableGridSnap();
;

            expect(resuue);
            expect(result.current.showOverlay).toBe(true);
        });

        it('should maintain stable references for callba=> {
            const { result, rerender } = renderHook(() => rapper });

dSnap;
            const initialEnable = result.current.enableGridSnap;
            const initialDisable = result.current.disableGridSnap;

            const initialUpdate = result.current.updateConfig;

            rerender();

            expect(result.current.toggleGridSnap).toBe(initialggle);
;
            expect(resu;

            expect(result.current.updateConfig).toBe(initialUpdate);
        });

        it('should maintain stable controller reference', () => {
            const { result, rerender } = renderHook(() => useGridSnaer });

ller;
            const initialPositionManager = result.current.positioer;

r();

            expect(result.current.controller).toBe(initialController);
r);
        });
);

    describe('different grid configurations', () => {
        it(> {
       ode[] = [
{
                    id: '1',
                    type: 'default',
                    position: { x: ,
                 ta: {},
                },
            ];

            const { result } ({
                en,
               50
);

> {
                result.current.snapExistingNodes(nodes, mockSetNodes);
    });

            expect(mockSetNodes).toHaveBeenCalledWi
               
1',
                    type: 'default',
                    position: { x: 50, y: 50 }, // Sgrid
           
  },
            ]);
        });

        it('should handle re {
            const nodes: Node[] = [
                {
                    id: '1',
                  
              ,

                },

                    id: '2',
                    type: 'default',
                    posi
                    data: {},
     },
            ];

            con);

            act(() => {
                r);
            });

            expect(mockSetNodes).toHaveBeenCalled();
            // The exact posi
            // butcalled
        });

        () => {
   );  });
}   });
  ed();
     enCall).toHaveBetNodesect(mockSe exp           
);
       }    des);
 mockSetNos, edge(nodes, roupingsvingGserngNodesPreExistiapnt.snsult.curre     re         > {
  act(() =       );

      { wrapper }: true }),bledidSnap({ ena => useGrerHook(()rendsult } = const { re          
  ;
 '2' }]'1', target:ce: sourdges = [{ st eon          c ];

                   },
       {},
      data:              ,
    5 } 2 15, y:x:{  position:             
       ault',: 'def   type            1',
     id: '                {
                     [
 Node[] = nodes:const         