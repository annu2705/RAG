# Cost-Efficient RAG System Architecture Guide

## Overview
Retrieval-Augmented Generation (RAG) is a pattern for enhancing LLM outputs with domain-specific document context.

## Document Chunking Guidelines
Recommended chunk sizes range from 300 to 800 tokens, with 50 to 100 tokens of overlap.
Deterministic hashing like SHA-256 ensures idempotent re-ingestion, avoiding duplicate vectors when documents are re-uploaded.

## Vector Database Indexing
ChromaDB uses HNSW (Hierarchical Navigable Small World) graphs for fast similarity search.
Citations contain the document name, page number, and chunk ID.

## No-Context Safety & Fallback
When no relevant context is found above the similarity threshold (e.g. 0.35), the system returns:
"No relevant information was found in the uploaded documents."
