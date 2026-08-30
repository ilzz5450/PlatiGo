import {toposort} from "toposort"
import type {WorkflowGraph} from "@/lib/db/schema"


export function validateGraph({nodes,edges}:WorkflowGraph): string[]{
    const problema: string[] = []

    const trigger = nodes.filter((n)=> n.data.kind==="trigger").length
    if(trigger!== 1){
        problema.push(`Graph must have exactly one trigger node, found ${trigger}`)
    }


    if (edges.length===0){
        problema.push("Connect and configue your platigo Nodes properly before Running workflow");

    }
    else{
        try{
        toposort(edges.map((e)=>[e.source, e.target]))



}
catch{
    problema.push("Workflow has a typicl cycle i.e ----> remove the loop before running the Workflow")
}
}
return problema 
}