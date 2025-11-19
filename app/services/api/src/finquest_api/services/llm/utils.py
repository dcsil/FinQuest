import copy
from typing import Any, Dict, Type
from pydantic import BaseModel

def get_gemini_compatible_schema(model: Type[BaseModel]) -> Dict[str, Any]:
    """
    Generates a JSON schema for a Pydantic model that is compatible with Gemini API.
    Gemini does not support '$defs' or '$ref', so we must inline all definitions.
    """
    schema = model.model_json_schema()
    
    # If there are no definitions, return as is
    if "$defs" not in schema and "definitions" not in schema:
        return schema
        
    return _dereference_schema(schema)

def _dereference_schema(schema: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively replaces $ref in the schema with the actual definition from $defs.
    Removes $defs from the final output.
    """
    schema = copy.deepcopy(schema)
    defs = schema.pop("$defs", {})
    if not defs:
        defs = schema.pop("definitions", {})

    def resolve_refs(node: Any) -> Any:
        if isinstance(node, dict):
            if "$ref" in node:
                ref_path = node["$ref"]
                # Handle #/$defs/Name or #/definitions/Name
                ref_key = ref_path.split("/")[-1]
                
                if ref_key in defs:
                    # Get the definition
                    definition = copy.deepcopy(defs[ref_key])
                    # Recursively resolve refs inside the definition
                    # (in case of nested models)
                    return resolve_refs(definition)
                else:
                    # If we can't resolve it, leave it (though it will likely fail in Gemini)
                    return node
            
            # Process all keys in the dictionary
            return {k: resolve_refs(v) for k, v in node.items()}
        
        elif isinstance(node, list):
            return [resolve_refs(item) for item in node]
        
        else:
            return node

    return resolve_refs(schema)
