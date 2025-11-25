
import React, { useEffect, useMemo, useCallback } from 'react';
import ReactFlow, { 
    Background, 
    Controls, 
    useNodesState, 
    useEdgesState,
    Node,
    Edge,
    Position
} from 'reactflow';
import dagre from 'dagre';
import { Workflow, TaskStateMap, Task, TaskType, DataStore, TaskStatus, PromptSFL } from '../../types';
import TaskNode from './TaskNode';

interface WorkflowCanvasProps {
    workflow: Workflow;
    prompts: PromptSFL[];
    taskStates: TaskStateMap;
    runFeedback: string[];
    onTaskClick: (task: Task) => void;
    dataStore: DataStore;
}

const nodeTypes = {
    taskNode: TaskNode,
};

const getNested = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc && acc[part], obj);

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 320; // Approximate width including padding/margin
const nodeHeight = 200; // Approximate height

const getLayoutedElements = (
    workflow: Workflow, 
    taskStates: TaskStateMap, 
    dataStore: DataStore,
    onTaskClick: (task: Task) => void
) => {
    dagreGraph.setGraph({ rankdir: 'LR' });

    workflow.tasks.forEach((task) => {
        dagreGraph.setNode(task.id, { width: nodeWidth, height: nodeHeight });
    });

    workflow.tasks.forEach((task) => {
        task.dependencies.forEach((depId) => {
            dagreGraph.setEdge(depId, task.id);
        });
    });

    dagre.layout(dagreGraph);

    const nodes: Node[] = workflow.tasks.map((task) => {
        const nodeWithPosition = dagreGraph.node(task.id);
        const hasInputData = task.type === TaskType.DATA_INPUT && task.inputKeys.some(key => {
            const value = getNested(dataStore, key);
            return value !== undefined && value !== null && value !== '';
        });

        return {
            id: task.id,
            type: 'taskNode',
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
            data: {
                task,
                state: taskStates[task.id] || { status: TaskStatus.PENDING },
                onClick: onTaskClick,
                hasInputData,
            },
        };
    });

    const edges: Edge[] = workflow.tasks.flatMap(task => task.dependencies.map(depId => ({
        id: `e-${depId}-${task.id}`,
        source: depId,
        target: task.id,
        type: 'smoothstep', // curved edges
        animated: true,
        style: { stroke: '#5c6f7e', strokeWidth: 2 },
    })));

    return { nodes, edges };
};

const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ 
    workflow, 
    prompts, // Kept in props if needed for future expansion, effectively used implicitly by parent passing tasks
    taskStates, 
    runFeedback, 
    onTaskClick, 
    dataStore 
}) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Recalculate layout and nodes whenever relevant data changes
    useEffect(() => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            workflow, 
            taskStates, 
            dataStore, 
            onTaskClick
        );
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, [workflow, taskStates, dataStore, onTaskClick, setNodes, setEdges]);

    return (
        <div className="flex-1 h-full bg-gray-900 relative">
            {runFeedback.length > 0 && (
                <div className="absolute top-4 left-4 z-20 max-w-md p-3 bg-amber-900/90 border-l-4 border-amber-500 text-amber-300 text-xs rounded shadow-lg backdrop-blur-sm">
                    <p className="font-bold mb-1">Execution Notes:</p>
                    <ul className="list-disc list-inside max-h-32 overflow-y-auto">
                        {runFeedback.map((fb, i) => <li key={i}>{fb}</li>)}
                    </ul>
                </div>
            )}
            
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.2}
                maxZoom={1.5}
                attributionPosition="bottom-right"
            >
                <Background color="#374151" gap={20} size={1} />
                <Controls className="bg-gray-800 border-gray-700 fill-gray-200" />
            </ReactFlow>
        </div>
    );
};

export default WorkflowCanvas;
