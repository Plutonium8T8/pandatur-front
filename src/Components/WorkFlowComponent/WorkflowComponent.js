import React from "react";
import { workflowOptions } from "../../FormOptions/WorkFlowOption";

export const Workflow = ({ticket, onChange = () => {}}) => {
    return (
        <div className="container-options-component">
        <label>
            Workflow:
            <select
                name="workflow"
                value={ticket ? ticket.workflow : workflowOptions[0]}
                onChange={onChange}
                className="workflow-select"
                style={{ display: 'block', width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
            >
                {workflowOptions.map(workflow => <option key={workflow} value={workflow}>{workflow}</option>)}
            </select>
        </label>
        </div>
    )
}

export default Workflow;