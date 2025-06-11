'use client'

import { createList, deleteList, getLists } from '@/lib/supabase/actions'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function ShoppingLists() {
  const [newListName, setNewListName] = useState('')
  const [lists, setLists] = useState<any[]>([])
  const supabase = createClient()

  // Client-side operation: Handle user logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // Client-side operation: Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Get the current user (client-side)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('Please sign in to create lists')
        return
      }

      // Server-side operation: Create new list
      const newList = await createList(user.id, newListName)
      
      // Client-side operation: Update UI
      setLists([newList, ...lists])
      setNewListName('')
    } catch (error) {
      console.error('Error creating list:', error)
      alert('Failed to create list')
    }
  }

  // Server-side operation: Load lists when component mounts
  const loadLists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const userLists = await getLists(user.id)
        setLists(userLists)
      }
    } catch (error) {
      console.error('Error loading lists:', error)
    }
  }

  // Client-side operation: Handle list deletion
  const handleDelete = async (listId: string) => {
    try {
      // Server-side operation: Delete from database
      await deleteList(listId)
      
      // Client-side operation: Update UI
      setLists(lists.filter(list => list.id !== listId))
    } catch (error) {
      console.error('Error deleting list:', error)
      alert('Failed to delete list')
    }
  }

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New List Name"
          className="border p-2 mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Create List
        </button>
      </form>

      <div className="space-y-4">
        {lists.map(list => (
          <div key={list.id} className="border p-4 rounded flex justify-between items-center">
            <h3>{list.name}</h3>
            <button
              onClick={() => handleDelete(list.id)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="mt-8 bg-gray-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  )
} 