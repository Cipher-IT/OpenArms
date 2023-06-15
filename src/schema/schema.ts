export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json }
    | Json[]

export interface Database {
    public: {
        Tables: {
            languages: {
                Row: {
                    created_at: string | null
                    id: number
                    iso_code: string | null
                    name: string | null
                    visible: boolean
                    written_name: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: number
                    iso_code?: string | null
                    name?: string | null
                    visible?: boolean
                    written_name?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: number
                    iso_code?: string | null
                    name?: string | null
                    visible?: boolean
                    written_name?: string | null
                }
                Relationships: []
            }
            messages: {
                Row: {
                    content: string | null
                    id: number
                    role: string | null
                    thread_id: string | null
                    timestamp: string | null
                    token_count: number | null
                }
                Insert: {
                    content?: string | null
                    id?: number
                    role?: string | null
                    thread_id?: string | null
                    timestamp?: string | null
                    token_count?: number | null
                }
                Update: {
                    content?: string | null
                    id?: number
                    role?: string | null
                    thread_id?: string | null
                    timestamp?: string | null
                    token_count?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "messages_thread_id_fkey"
                        columns: ["thread_id"]
                        referencedRelation: "threads"
                        referencedColumns: ["id"]
                    }
                ]
            }
            summaries: {
                Row: {
                    content: string | null
                    created_at: string | null
                    id: number
                    thread_id: string | null
                    token_used: number | null
                }
                Insert: {
                    content?: string | null
                    created_at?: string | null
                    id?: number
                    thread_id?: string | null
                    token_used?: number | null
                }
                Update: {
                    content?: string | null
                    created_at?: string | null
                    id?: number
                    thread_id?: string | null
                    token_used?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "summaries_thread_id_fkey"
                        columns: ["thread_id"]
                        referencedRelation: "threads"
                        referencedColumns: ["id"]
                    }
                ]
            }
            threads: {
                Row: {
                    created_at: string | null
                    file: Json | null
                    id: string
                    tite: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    file?: Json | null
                    id?: string
                    tite?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    file?: Json | null
                    id?: string
                    tite?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "threads_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            users: {
                Row: {
                    created_at: string | null
                    email: string | null
                    id: number
                    language_id: number | null
                    uuid: string | null
                }
                Insert: {
                    created_at?: string | null
                    email?: string | null
                    id?: number
                    language_id?: number | null
                    uuid?: string | null
                }
                Update: {
                    created_at?: string | null
                    email?: string | null
                    id?: number
                    language_id?: number | null
                    uuid?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "users_language_id_fkey"
                        columns: ["language_id"]
                        referencedRelation: "languages"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "users_uuid_fkey"
                        columns: ["uuid"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}