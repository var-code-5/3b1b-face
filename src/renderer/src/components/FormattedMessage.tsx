import React, { useMemo } from 'react';
import { CheckCircle2, Circle, Clock, ArrowRight, Terminal, Brain, ListTodo } from 'lucide-react';

interface FormattedMessageProps {
    text: string;
    isUser: boolean;
}

interface AgentStep {
    get_user_intent?: {
        user_message: string;
    };
    generate_plan?: {
        steps: string[];
        current_step: number;
    };
    execute_qwen?: {
        messages: string[];
        previous_actions: Array<{
            tool: string;
            args: Record<string, any>;
            result: string;
        }>;
    };
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ text, isUser }) => {
    const parsedContent = useMemo(() => {
        if (isUser) return null;

        try {
            // Handle concatenated JSON objects (e.g. "}{")
            const jsonString = text.replace(/}\s*{/g, '},{');
            const wrappedJson = `[${jsonString}]`;
            const parsed = JSON.parse(wrappedJson);

            // Validate if it looks like our agent structure
            const isAgentMessage = parsed.some((item: any) =>
                item.get_user_intent || item.generate_plan || item.execute_qwen
            );

            return isAgentMessage ? parsed : null;
        } catch (e) {
            return null;
        }
    }, [text, isUser]);

    if (!parsedContent) {
        return (
            <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                {text}
            </p>
        );
    }

    return (
        <div className="space-y-4 w-full">
            {parsedContent.map((block: AgentStep, index: number) => (
                <div key={index} className="space-y-2">
                    {/* User Intent Block */}
                    {block.get_user_intent && (
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-2 text-purple-400">
                                <Brain className="w-4 h-4" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Understanding Intent</span>
                            </div>
                            <p className="text-sm text-slate-300 italic">
                                "{block.get_user_intent.user_message}"
                            </p>
                        </div>
                    )}

                    {/* Plan Generation Block */}
                    {block.generate_plan && (
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-3 text-blue-400">
                                <ListTodo className="w-4 h-4" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Execution Plan</span>
                            </div>
                            <div className="space-y-2">
                                {block.generate_plan.steps.map((step, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        {i < block.generate_plan!.current_step ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        ) : i === block.generate_plan!.current_step ? (
                                            <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0 animate-pulse" />
                                        ) : (
                                            <Circle className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                                        )}
                                        <span className={`text-sm ${i === block.generate_plan!.current_step ? 'text-blue-200 font-medium' :
                                                i < block.generate_plan!.current_step ? 'text-slate-400' : 'text-slate-500'
                                            }`}>
                                            {step}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Execution Block */}
                    {block.execute_qwen && (
                        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-3 text-amber-400">
                                <Terminal className="w-4 h-4" />
                                <span className="text-xs font-semibold uppercase tracking-wider">System Actions</span>
                            </div>

                            {block.execute_qwen.previous_actions.map((action, i) => (
                                <div key={i} className="mb-3 last:mb-0 bg-black/20 rounded p-2">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                        <ArrowRight className="w-3 h-3" />
                                        <span className="font-mono text-amber-200/80">{action.tool}</span>
                                    </div>
                                    {/* Show args if needed, maybe collapsed by default? For now just showing result summary */}
                                    <div className="text-xs font-mono text-slate-500 pl-5 truncate">
                                        {JSON.stringify(action.args)}
                                    </div>
                                    {action.result && (
                                        <div className="mt-1 pl-5 text-xs text-green-400/80 font-mono border-l-2 border-green-900/30">
                                            {action.result.slice(0, 100)}{action.result.length > 100 ? '...' : ''}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {block.execute_qwen.messages.length > 0 && (
                                <div className="mt-2 text-xs text-slate-400 font-mono bg-black/40 p-2 rounded">
                                    {block.execute_qwen.messages[block.execute_qwen.messages.length - 1]}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default FormattedMessage;
