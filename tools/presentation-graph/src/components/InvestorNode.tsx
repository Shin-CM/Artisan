import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { Node, NodeProps } from "@xyflow/react";
import type { InvestorGroup } from "../lib/investorGraphGroups";
import { isInvestorGroup } from "../lib/investorGraphGroups";

export type InvestorNodeData = {
  label: string;
  group: InvestorGroup;
  pgDimmed?: boolean;
  pgNeighbor?: boolean;
  pgFocus?: boolean;
};

export type InvestorNodeType = Node<InvestorNodeData, "investor">;

function InvestorNodeInner({ data }: NodeProps<InvestorNodeType>) {
  const group: InvestorGroup =
    typeof data.group === "string" && isInvestorGroup(data.group)
      ? data.group
      : "plateforme";

  const className = [
    "investor-node",
    data.pgDimmed && "investor-node--dimmed",
    data.pgNeighbor && "investor-node--neighbor",
    data.pgFocus && "investor-node--focus",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className} data-group={group}>
      <Handle type="target" position={Position.Left} />
      <span className="investor-node__label">{data.label}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export const InvestorNode = memo(InvestorNodeInner);
