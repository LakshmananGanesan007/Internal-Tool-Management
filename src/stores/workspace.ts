import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../services/supabase'
import { useUIStore } from './ui'
import { useAuthStore } from './auth'

export const useWorkspaceStore = defineStore('workspace', () => {
  const currentWorkspace = ref<any>(null)
  const channels = ref<any[]>([])
  const activeChannel = ref<any>(null)
  
  const allWorkspaceCategories = ref<any[]>([])
  const allWorkspaceTools = ref<any[]>([])
  
  const categories = ref<any[]>([])
  const activeCategory = ref<any>(null)
  const tools = ref<any[]>([])
  
  const favoriteToolIds = ref<string[]>([])
  const isFetching = ref(false)
  const isInitializing = ref(true)

  // ==========================================
  // 1. WORKSPACE INITIALIZATION
  // ==========================================
  function syncBrowserMeta() {
    if (currentWorkspace.value) {
      document.title = currentWorkspace.value.name || 'ToolHive';
      if (currentWorkspace.value.logo_url) {
        let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.removeAttribute('type');
        link.href = currentWorkspace.value.logo_url;
      }
    }
  }

  async function initWorkspace() {
    isInitializing.value = true
    const { data: { user } } = await supabase.auth.getUser()
    const uiStore = useUIStore()
    
    if (!user) {
      isInitializing.value = false
      return
    }

    const { data: workspaces } = await supabase.from('workspaces').select('*').eq('user_id', user.id)
    if (!workspaces || workspaces.length === 0) {
      const { data: newWs, error } = await supabase.from('workspaces').insert({ name: 'My Workspace', user_id: user.id }).select().single()
      if (error) { uiStore.addToast("Failed to create workspace.", "error"); return }
      currentWorkspace.value = newWs
    } else {
      currentWorkspace.value = workspaces[0]
    }
    
    syncBrowserMeta()
    await fetchAllWorkspaceData()
    await fetchChannels()

    setTimeout(() => { isInitializing.value = false }, 800)
  }

  async function fetchAllWorkspaceData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [catsRes, toolsRes, favsRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', user.id).order('sort_order'),
      supabase.from('tools').select('*').eq('user_id', user.id).order('sort_order'),
      supabase.from('favorites').select('tool_id').eq('user_id', user.id)
    ])
    allWorkspaceCategories.value = catsRes.data || []
    allWorkspaceTools.value = toolsRes.data || []
    favoriteToolIds.value = favsRes.data ? favsRes.data.map(f => f.tool_id) : []
  }

  // ==========================================
  // 2. NAVIGATION STATE
  // ==========================================
  async function setActiveChannel(channel: any) {
    if (activeChannel.value?.id === channel.id) return
    activeChannel.value = channel
    categories.value = allWorkspaceCategories.value.filter(c => c.channel_id === channel.id).sort((a, b) => a.sort_order - b.sort_order)
    if (categories.value.length > 0) {
      activeCategory.value = categories.value[0]
      tools.value = allWorkspaceTools.value.filter(t => t.category_id === activeCategory.value.id).sort((a, b) => a.sort_order - b.sort_order)
    } else { 
      activeCategory.value = null
      tools.value = [] 
    }
  }

  async function setActiveCategory(category: any) {
    if (activeCategory.value?.id === category.id) return
    activeCategory.value = category
    tools.value = allWorkspaceTools.value.filter(t => t.category_id === category.id).sort((a, b) => a.sort_order - b.sort_order)
  }

  // ==========================================
  // 3. BRANDING & PROFILES
  // ==========================================
  async function uploadLogo(file: File) {
    const uiStore = useUIStore()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !currentWorkspace.value) return
    
    currentWorkspace.value.logo_url = URL.createObjectURL(file)
    syncBrowserMeta()

    const filePath = `${user.id}/${currentWorkspace.value.id}-logo-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('workspace-logos').upload(filePath, file, { upsert: true })
    if (error) { uiStore.addToast("Logo upload failed", "error"); return }
    
    const { data: { publicUrl } } = supabase.storage.from('workspace-logos').getPublicUrl(filePath)
    await supabase.from('workspaces').update({ logo_url: publicUrl }).eq('id', currentWorkspace.value.id)
    currentWorkspace.value.logo_url = publicUrl
    syncBrowserMeta()
    uiStore.addToast("Workspace logo updated!", "success")
  }

  async function deleteLogo() {
    if (!confirm("Permanently delete Workspace Logo?")) return
    const uiStore = useUIStore()
    currentWorkspace.value.logo_url = null
    await supabase.from('workspaces').update({ logo_url: null }).eq('id', currentWorkspace.value.id)
    syncBrowserMeta()
    uiStore.addToast("Logo deleted", "success")
  }
  
  async function uploadWordmark(file: File) {
    const uiStore = useUIStore()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !currentWorkspace.value) return
    
    currentWorkspace.value.wordmark_url = URL.createObjectURL(file)

    const filePath = `wordmarks/${user.id}/${currentWorkspace.value.id}-wordmark-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('workspace-logos').upload(filePath, file, { upsert: true })
    if (error) { uiStore.addToast("Text logo upload failed", "error"); return }
    
    const { data: { publicUrl } } = supabase.storage.from('workspace-logos').getPublicUrl(filePath)
    await supabase.from('workspaces').update({ wordmark_url: publicUrl }).eq('id', currentWorkspace.value.id)
    currentWorkspace.value.wordmark_url = publicUrl
    uiStore.addToast("Text logo updated!", "success")
  }

  async function deleteWordmark() {
    if (!confirm("Permanently delete Text Logo?")) return
    const uiStore = useUIStore()
    currentWorkspace.value.wordmark_url = null
    await supabase.from('workspaces').update({ wordmark_url: null }).eq('id', currentWorkspace.value.id)
    uiStore.addToast("Text logo deleted", "success")
  }

  async function updateWorkspaceName(newName: string) {
    const uiStore = useUIStore()
    if (!currentWorkspace.value || !newName.trim()) return
    const { error } = await supabase.from('workspaces').update({ name: newName }).eq('id', currentWorkspace.value.id)
    if (error) {
      uiStore.addToast("Failed to update workspace name", "error")
    } else { 
      currentWorkspace.value.name = newName
      syncBrowserMeta()
      uiStore.addToast("Workspace renamed successfully!", "success") 
    }
  }

  async function uploadProfilePicture(file: File) {
    const uiStore = useUIStore()
    const authStore = useAuthStore()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const tempUrl = URL.createObjectURL(file)
    if (authStore.user) authStore.user.user_metadata = { ...authStore.user.user_metadata, avatar_url: tempUrl }

    const filePath = `avatars/${user.id}-${Date.now()}.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage.from('workspace-logos').upload(filePath, file, { upsert: true })
    if (uploadError) { uiStore.addToast("Upload failed", "error"); return }
    
    const { data: { publicUrl } } = supabase.storage.from('workspace-logos').getPublicUrl(filePath)
    const { error } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
    
    if (error) { 
      uiStore.addToast("Failed to update profile", "error") 
    } else {
      if (authStore.user) authStore.user.user_metadata = { ...authStore.user.user_metadata, avatar_url: publicUrl }
      uiStore.addToast("Profile picture updated!", "success")
    }
  }

  async function deleteProfilePicture() {
    if (!confirm("Permanently delete Profile Picture?")) return
    const uiStore = useUIStore()
    const authStore = useAuthStore()
    const { error } = await supabase.auth.updateUser({ data: { avatar_url: null } })
    if (!error && authStore.user) {
      authStore.user.user_metadata.avatar_url = null
      uiStore.addToast("Profile picture deleted", "success")
    }
  }

  // ==========================================
  // 4. BACKUPS (JSON)
  // ==========================================
  async function exportBackup() {
    const uiStore = useUIStore()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      uiStore.addToast("Preparing export...", "success")
      
      const { data: expChannels } = await supabase.from('channels').select('*').eq('workspace_id', currentWorkspace.value.id)
      const { data: expCategories } = await supabase.from('categories').select('*').eq('user_id', user.id)
      const { data: expTools } = await supabase.from('tools').select('*').eq('user_id', user.id)

      const backup = { channels: expChannels, categories: expCategories, tools: expTools }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentWorkspace.value.name.replace(/\s+/g, '_')}_Backup_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      uiStore.addToast("Data exported successfully!", "success")
    } catch (err) { 
      uiStore.addToast("Failed to export data", "error") 
    }
  }

  async function restoreBackup(jsonData: any) {
    const uiStore = useUIStore()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !jsonData.channels || !jsonData.categories || !jsonData.tools) {
      uiStore.addToast("Invalid backup file format.", "error")
      return
    }
    uiStore.addToast("Restoring backup... Please wait.", "success")
    isFetching.value = true

    try {
      for (const oldChannel of jsonData.channels) {
        const { data: newChannel } = await supabase.from('channels').insert({ workspace_id: currentWorkspace.value.id, user_id: user.id, name: oldChannel.name, icon_url: oldChannel.icon_url, sort_order: oldChannel.sort_order }).select().single()
        if (!newChannel) continue
        const oldCats = jsonData.categories.filter((c: any) => c.channel_id === oldChannel.id)
        for (const oldCat of oldCats) {
          const { data: newCat } = await supabase.from('categories').insert({ channel_id: newChannel.id, user_id: user.id, name: oldCat.name, sort_order: oldCat.sort_order }).select().single()
          if (!newCat) continue
          const oldTools = jsonData.tools.filter((t: any) => t.category_id === oldCat.id)
          for (const oldTool of oldTools) {
            await supabase.from('tools').insert({ category_id: newCat.id, user_id: user.id, name: oldTool.name, url: oldTool.url, logo_url: oldTool.logo_url, tags: oldTool.tags, sort_order: oldTool.sort_order })
          }
        }
      }
      await fetchAllWorkspaceData()
      await fetchChannels()
      uiStore.addToast("Backup restored successfully!", "success")
    } catch (err) { 
      uiStore.addToast("Failed to restore backup completely.", "error") 
    } finally { 
      isFetching.value = false 
    }
  }

  // ==========================================
  // 5. CHANNELS CRUD
  // ==========================================
  async function fetchChannels() {
    if (!currentWorkspace.value) return
    const { data } = await supabase.from('channels').select('*').eq('workspace_id', currentWorkspace.value.id).order('sort_order')
    channels.value = data || []
    if (channels.value.length > 0 && !activeChannel.value) await setActiveChannel(channels.value[0])
  }

  async function saveChannelOrder() { 
    channels.value.forEach((c, index) => { c.sort_order = index })
    await Promise.all(channels.value.map(c => supabase.from('channels').update({ sort_order: c.sort_order }).eq('id', c.id))) 
  }

  async function uploadChannelIcon(file: File) { 
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const filePath = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('channel-icons').upload(filePath, file)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('channel-icons').getPublicUrl(filePath)
    return publicUrl 
  }

  async function addChannel(name: string, icon_url?: string) { 
    const { data: { user } } = await supabase.auth.getUser()
    const uiStore = useUIStore()
    if (!currentWorkspace.value || !user) return
    const { data, error } = await supabase.from('channels').insert({ workspace_id: currentWorkspace.value.id, user_id: user.id, name, icon_url, sort_order: channels.value.length }).select().single()
    
    if (error) {
      uiStore.addToast("Failed to create channel.", "error")
    } else if (data) { 
      channels.value.push(data)
      if (!activeChannel.value) await setActiveChannel(data)
      uiStore.addToast("Channel created", "success") 
    } 
  }

  async function updateChannel(id: string, newName: string, icon_url?: string) { 
    const uiStore = useUIStore()
    const updatePayload: any = { name: newName }
    if (icon_url !== undefined) updatePayload.icon_url = icon_url
    
    const { error } = await supabase.from('channels').update(updatePayload).eq('id', id)
    if (error) {
      uiStore.addToast("Failed to update channel.", "error")
    } else { 
      const index = channels.value.findIndex(c => c.id === id)
      if (index !== -1) { 
        channels.value[index].name = newName
        if (icon_url !== undefined) channels.value[index].icon_url = icon_url 
      } 
      if (activeChannel.value?.id === id) { 
        activeChannel.value.name = newName
        if (icon_url !== undefined) activeChannel.value.icon_url = icon_url 
      } 
      uiStore.addToast("Channel updated", "success") 
    } 
  }

  async function deleteChannel(id: string) { 
    if (!confirm("Delete this channel and everything inside it?")) return
    const uiStore = useUIStore()
    const { error } = await supabase.from('channels').delete().eq('id', id)
    if (error) {
      uiStore.addToast("Failed to delete channel.", "error")
    } else { 
      channels.value = channels.value.filter(c => c.id !== id)
      uiStore.addToast("Channel deleted", "success")
      await fetchAllWorkspaceData()
      if (activeChannel.value?.id === id) { 
        activeChannel.value = null; categories.value = []; activeCategory.value = null; tools.value = []
        if (channels.value.length > 0) await setActiveChannel(channels.value[0]) 
      } 
    } 
  }

  // ==========================================
  // 6. CATEGORIES & TOOLS CRUD
  // ==========================================
  async function fetchCategoriesAndTools() { 
    await setActiveChannel(activeChannel.value) 
  }

  async function saveCategoryOrder() { 
    categories.value.forEach((c, index) => { c.sort_order = index })
    await Promise.all(categories.value.map(c => supabase.from('categories').update({ sort_order: c.sort_order }).eq('id', c.id))) 
  }

  // Added underscore to _categoryId to satisfy strict TypeScript rules
  async function saveToolOrder(_categoryId: string, orderedTools: any[]) { 
    orderedTools.forEach((t, index) => { 
      const toolInStore = tools.value.find(st => st.id === t.id)
      if (toolInStore) toolInStore.sort_order = index
      const toolInGlobal = allWorkspaceTools.value.find(st => st.id === t.id)
      if (toolInGlobal) toolInGlobal.sort_order = index 
    })
    await Promise.all(orderedTools.map((t, index) => supabase.from('tools').update({ sort_order: index }).eq('id', t.id))) 
  }

  async function addCategory(name: string) { 
    const { data: { user } } = await supabase.auth.getUser()
    const uiStore = useUIStore()
    if (!activeChannel.value || !user) return
    const { data, error } = await supabase.from('categories').insert({ channel_id: activeChannel.value.id, user_id: user.id, name, sort_order: categories.value.length }).select().single()
    if (error) {
      uiStore.addToast("Failed to add category", "error")
    } else if (data) { 
      allWorkspaceCategories.value.push(data)
      categories.value.push(data)
      if (!activeCategory.value) { activeCategory.value = data; tools.value = [] } 
      uiStore.addToast("Category created", "success") 
    } 
  }

  async function updateCategory(id: string, newName: string) { 
    const uiStore = useUIStore()
    const { error } = await supabase.from('categories').update({ name: newName }).eq('id', id)
    if (error) {
      uiStore.addToast("Failed to update category", "error")
    } else { 
      const globalIndex = allWorkspaceCategories.value.findIndex(c => c.id === id)
      if (globalIndex !== -1) allWorkspaceCategories.value[globalIndex].name = newName
      const localIndex = categories.value.findIndex(c => c.id === id)
      if (localIndex !== -1) categories.value[localIndex].name = newName
      if (activeCategory.value?.id === id) activeCategory.value.name = newName
      uiStore.addToast("Category updated", "success") 
    } 
  }

  async function deleteCategory(id: string) { 
    if (!confirm("Delete this category and all tools inside it?")) return
    const uiStore = useUIStore()
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) {
      uiStore.addToast("Failed to delete category", "error")
    } else { 
      allWorkspaceCategories.value = allWorkspaceCategories.value.filter(c => c.id !== id)
      categories.value = categories.value.filter(c => c.id !== id)
      allWorkspaceTools.value = allWorkspaceTools.value.filter(t => t.category_id !== id)
      tools.value = tools.value.filter(t => t.category_id !== id)
      if (activeCategory.value?.id === id) { 
        activeCategory.value = categories.value.length > 0 ? categories.value[0] : null
        if (activeCategory.value) { 
          tools.value = allWorkspaceTools.value.filter(t => t.category_id === activeCategory.value.id).sort((a, b) => a.sort_order - b.sort_order) 
        } else { 
          tools.value = [] 
        } 
      } 
      uiStore.addToast("Category deleted", "success") 
    } 
  }

  async function addTool(categoryId: string, toolData: any) { 
    const { data: { user } } = await supabase.auth.getUser()
    const uiStore = useUIStore()
    if (!user) return
    const { data, error } = await supabase.from('tools').insert({ category_id: categoryId, user_id: user.id, ...toolData, sort_order: tools.value.filter(t => t.category_id === categoryId).length }).select().single()
    if (error) {
      uiStore.addToast("Failed to add tool", "error")
    } else if (data) { 
      tools.value.push(data)
      allWorkspaceTools.value.push(data)
      uiStore.addToast("Tool added", "success") 
    } 
  }

  async function deleteTool(id: string) { 
    if (!confirm("Permanently delete this tool?")) return
    const uiStore = useUIStore()
    const { error } = await supabase.from('tools').delete().eq('id', id)
    if (error) {
      uiStore.addToast("Failed to delete tool", "error")
    } else { 
      tools.value = tools.value.filter(t => t.id !== id)
      allWorkspaceTools.value = allWorkspaceTools.value.filter(t => t.id !== id)
      favoriteToolIds.value = favoriteToolIds.value.filter(fid => fid !== id)
      uiStore.addToast("Tool deleted successfully", "success") 
    } 
  }

  // ==========================================
  // 7. FAVORITES SYSTEM
  // ==========================================
  async function toggleFavorite(toolId: string) { 
    const { data: { user } } = await supabase.auth.getUser()
    const uiStore = useUIStore()
    if (!user) return
    
    if (favoriteToolIds.value.includes(toolId)) { 
      const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('tool_id', toolId)
      if (!error) {
        favoriteToolIds.value = favoriteToolIds.value.filter(id => id !== toolId)
      } else {
        uiStore.addToast("Failed to remove favorite", "error")
      }
    } else { 
      const { error } = await supabase.from('favorites').insert({ user_id: user.id, tool_id: toolId })
      if (!error) {
        favoriteToolIds.value.push(toolId)
      } else {
        uiStore.addToast("Failed to add favorite", "error")
      }
    } 
  }

  return { 
    currentWorkspace, channels, activeChannel, categories, activeCategory, tools, allWorkspaceTools, favoriteToolIds, isFetching, isInitializing,
    initWorkspace, addChannel, updateChannel, deleteChannel, saveChannelOrder, saveCategoryOrder, uploadChannelIcon, saveToolOrder,
    setActiveChannel, setActiveCategory, fetchCategoriesAndTools, addCategory, updateCategory, deleteCategory, addTool, deleteTool,
    toggleFavorite, uploadLogo, deleteLogo, uploadWordmark, deleteWordmark, updateWorkspaceName, exportBackup, restoreBackup, uploadProfilePicture, deleteProfilePicture
  }
})