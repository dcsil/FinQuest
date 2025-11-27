"""
Tests for LLM utils
"""
import pytest
from pydantic import BaseModel, Field
from finquest_api.services.llm.utils import get_gemini_compatible_schema, _dereference_schema


class SimpleModel(BaseModel):
    """Simple test model"""
    name: str
    age: int


class NestedModel(BaseModel):
    """Model with nested reference"""
    user: SimpleModel
    count: int


class TestGetGeminiCompatibleSchema:
    """Tests for get_gemini_compatible_schema function"""
    
    def test_simple_model_no_defs(self):
        """Test schema generation for simple model without $defs"""
        schema = get_gemini_compatible_schema(SimpleModel)
        
        assert "properties" in schema
        assert "name" in schema["properties"]
        assert "age" in schema["properties"]
        assert "$defs" not in schema
        assert "definitions" not in schema
    
    def test_nested_model_with_defs(self):
        """Test schema generation for nested model with $defs"""
        schema = get_gemini_compatible_schema(NestedModel)
        
        # Should have inlined definitions
        assert "$defs" not in schema
        assert "definitions" not in schema
        # The nested model should be inlined
        assert "properties" in schema
        assert "user" in schema["properties"]


class TestDereferenceSchema:
    """Tests for _dereference_schema function"""
    
    def test_schema_without_defs(self):
        """Test schema without definitions"""
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"}
            }
        }
        
        result = _dereference_schema(schema)
        
        assert result == schema
        assert "$defs" not in result
    
    def test_schema_with_refs(self):
        """Test schema with $ref references"""
        schema = {
            "type": "object",
            "properties": {
                "user": {"$ref": "#/$defs/SimpleModel"}
            },
            "$defs": {
                "SimpleModel": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"}
                    }
                }
            }
        }
        
        result = _dereference_schema(schema)
        
        assert "$defs" not in result
        assert "$ref" not in str(result)
        assert "properties" in result["properties"]["user"]
    
    def test_schema_with_definitions_key(self):
        """Test schema with 'definitions' key instead of '$defs'"""
        schema = {
            "type": "object",
            "properties": {
                "user": {"$ref": "#/definitions/SimpleModel"}
            },
            "definitions": {
                "SimpleModel": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"}
                    }
                }
            }
        }
        
        result = _dereference_schema(schema)
        
        assert "definitions" not in result
        assert "$ref" not in str(result)
    
    def test_nested_refs(self):
        """Test schema with nested references"""
        schema = {
            "type": "object",
            "properties": {
                "outer": {"$ref": "#/$defs/Outer"}
            },
            "$defs": {
                "Outer": {
                    "type": "object",
                    "properties": {
                        "inner": {"$ref": "#/$defs/Inner"}
                    }
                },
                "Inner": {
                    "type": "object",
                    "properties": {
                        "value": {"type": "string"}
                    }
                }
            }
        }
        
        result = _dereference_schema(schema)
        
        assert "$defs" not in result
        assert "$ref" not in str(result)
    
    def test_ref_to_missing_def(self):
        """Test schema with reference to missing definition"""
        schema = {
            "type": "object",
            "properties": {
                "user": {"$ref": "#/$defs/MissingModel"}
            },
            "$defs": {}
        }
        
        result = _dereference_schema(schema)
        
        # Should leave the $ref as-is if definition is missing
        assert "$ref" in str(result["properties"]["user"])

