import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import { useUIStore } from './ui'
import { useAuthStore } from './auth'
import { prepareImage, fileExt } from '../utils/image'
import { normalizeUrl } from '../utils/url'
import { getFaviconUrl } from '../utils/favicon'
import type { Workspace, Channel, Category, Tool } from '../types'

const RECENT_KEY = 'toolhive:recent'
const readRecent = (): string[] => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] } }

export const useWorkspaceStore = defineStore('workspace', () => {
  const currentWorkspace = ref<Workspace | null>(null)
  const channels = ref<Channel[]>([])
  const activeChannel = ref<Channel | null>(null)

  const allWorkspaceCategories = ref<Category[]>([])
  const allWorkspaceTools = ref<Tool[]>([])

  const categories = ref<Category[]>([])
  const activeCategory = ref<Category | null>(null)
  const tools = ref<Tool[]>([])

  const favoriteToolIds = ref<string[]>([])
  const recentToolIds = ref<string[]>(readRecent())
  const isFetching = ref(false)
  const isInitializing = ref(true)
  const loadError = ref('')

  const recentTools = computed(() =>
    recentToolIds.value.map(id => allWorkspaceTools.value.find(t => t.id === id)).filter((t): t is Tool => !!t).slice(0, 8))

  const uid = () => useAuthStore().userId
  const toast = (m: string, t: 'success' | 'error' | 'info' = 'success') => useUIStore().addToast(m, t)
  const bySort = (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order

  // ==========================================
  // 1. INITIALIZATION
  // ==========================================
  function syncBrowserMeta() {
    const ws = currentWorkspace.value
    if (!ws) return
    document.title = ws.name || 'ToolHive'
    if (ws.logo_url) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link) }
      link.removeAttribute('type')
      link.href = ws.logo_url
    }
  }

  async function initWorkspace(force = false) {
    if (currentWorkspace.value && !force) { isInitializing.value = false; return }
    isInitializing.value = true
    loadError.value = ''
    // Never leave the user stuck on the splash screen
    const safety = setTimeout(() => { isInitializing.value = false }, 10000)
    try {
      const userId = uid()
      if (!userId) return

      const { data: workspaces, error } = await supabase.from('workspaces').select('*').eq('user_id', userId).limit(1)
      if (error) throw error
      if (workspaces && workspaces.length > 0) {
        currentWorkspace.value = workspaces[0] as Workspace
      } else {
        const { data: created, error: createErr } = await supabase.from('workspaces').insert({ name: 'My Workspace', user_id: userId }).select().single()
        if (createErr) throw createErr
        currentWorkspace.value = created as Workspace
      }
      syncBrowserMeta()

      // Everything in parallel: one round-trip of latency instead of four
      const [cats, toolsRes, favs, chans] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', userId).order('sort_order'),
        supabase.from('tools').select('*').eq('user_id', userId).order('sort_order'),
        supabase.from('favorites').select('tool_id').eq('user_id', userId),
        supabase.from('channels').select('*').eq('workspace_id', currentWorkspace.value.id).order('sort_order'),
      ])
      allWorkspaceCategories.value = (cats.data as Category[]) || []
      allWorkspaceTools.value = (toolsRes.data as Tool[]) || []
      favoriteToolIds.value = (favs.data || []).map((f: any) => f.tool_id)
      channels.value = (chans.data as Channel[]) || []
      if (channels.value.length > 0 && !activeChannel.value) await setActiveChannel(channels.value[0])
    } catch (e: any) {
      console.error(e)
      loadError.value = e?.message || 'Could not load your workspace.'
      toast('Could not load your workspace. Check your connection.', 'error')
    } finally {
      clearTimeout(safety)
      isInitializing.value = false
    }
  }

  function reset() {
    currentWorkspace.value = null; channels.value = []; activeChannel.value = null
    allWorkspaceCategories.value = []; allWorkspaceTools.value = []
    categories.value = []; activeCategory.value = null; tools.value = []
    favoriteToolIds.value = []; isInitializing.value = true
  }

  async function fetchAllWorkspaceData() {
    const userId = uid(); if (!userId) return
    const [catsRes, toolsRes, favsRes] = await Promise.all([
      supabase.from('categories').select('*').eq('user_id', userId).order('sort_order'),
      supabase.from('tools').select('*').eq('user_id', userId).order('sort_order'),
      supabase.from('favorites').select('tool_id').eq('user_id', userId),
    ])
    allWorkspaceCategories.value = (catsRes.data as Category[]) || []
    allWorkspaceTools.value = (toolsRes.data as Tool[]) || []
    favoriteToolIds.value = (favsRes.data || []).map((f: any) => f.tool_id)
  }

  // ==========================================
  // 2. NAVIGATION STATE
  // ==========================================
  function loadCategoryTools() {
    tools.value = activeCategory.value
      ? allWorkspaceTools.value.filter(t => t.category_id === activeCategory.value!.id).sort(bySort)
      : []
  }

  async function setActiveChannel(channel: Channel | null) {
    if (!channel) { activeChannel.value = null; categories.value = []; activeCategory.value = null; tools.value = []; return }
    if (activeChannel.value?.id === channel.id) return
    activeChannel.value = channel
    categories.value = allWorkspaceCategories.value.filter(c => c.channel_id === channel.id).sort(bySort)
    activeCategory.value = categories.value[0] ?? null
    loadCategoryTools()
  }

  async function setActiveCategory(category: Category) {
    if (activeCategory.value?.id === category.id) return
    activeCategory.value = category
    loadCategoryTools()
  }

  // ==========================================
  // 3. BRANDING & PROFILES
  // ==========================================
  async function uploadToBucket(bucket: string, path: string, file: File) {
    const prepared = await prepareImage(file)
    const { error } = await supabase.storage.from(bucket).upload(path, prepared, { upsert: true, contentType: prepared.type, cacheControl: '31536000' })
    if (error) throw error
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
  }

  async function uploadLogo(file: File) {
    const userId = uid(); const ws = currentWorkspace.value
    if (!userId || !ws) return
    try {
      const url = await uploadToBucket('workspace-logos', `${userId}/${ws.id}-logo-${Date.now()}.${fileExt(file)}`, file)
      const { error } = await supabase.from('workspaces').update({ logo_url: url }).eq('id', ws.id)
      if (error) throw error
      ws.logo_url = url; syncBrowserMeta(); toast('Workspace logo updated!')
    } catch (e: any) { toast(e?.message || 'Logo upload failed', 'error') }
  }

  async function deleteLogo() {
    const ws = currentWorkspace.value; if (!ws || !confirm('Delete the workspace logo?')) return
    const { error } = await supabase.from('workspaces').update({ logo_url: null }).eq('id', ws.id)
    if (error) return toast('Failed to delete logo', 'error')
    ws.logo_url = null; toast('Logo deleted')
  }

  async function uploadWordmark(file: File) {
    const userId = uid(); const ws = currentWorkspace.value
    if (!userId || !ws) return
    try {
      const url = await uploadToBucket('workspace-logos', `wordmarks/${userId}/${ws.id}-wordmark-${Date.now()}.${fileExt(file)}`, file)
      const { error } = await supabase.from('workspaces').update({ wordmark_url: url }).eq('id', ws.id)
      if (error) throw error
      ws.wordmark_url = url; toast('Text logo updated!')
    } catch (e: any) { toast(e?.message || 'Text logo upload failed', 'error') }
  }

  async function deleteWordmark() {
    const ws = currentWorkspace.value; if (!ws || !confirm('Delete the text logo?')) return
    const { error } = await supabase.from('workspaces').update({ wordmark_url: null }).eq('id', ws.id)
    if (error) return toast('Failed to delete text logo', 'error')
    ws.wordmark_url = null; toast('Text logo deleted')
  }

  async function updateWorkspaceName(newName: string) {
    const ws = currentWorkspace.value; const name = newName.trim()
    if (!ws || !name) return
    const { error } = await supabase.from('workspaces').update({ name }).eq('id', ws.id)
    if (error) return toast('Failed to update workspace name', 'error')
    ws.name = name; syncBrowserMeta(); toast('Workspace renamed!')
  }

  async function uploadProfilePicture(file: File) {
    const userId = uid(); if (!userId) return
    try {
      const url = await uploadToBucket('workspace-logos', `avatars/${userId}-${Date.now()}.${fileExt(file)}`, file)
      await useAuthStore().updateProfile({ avatar_url: url })
      toast('Profile picture updated!')
    } catch (e: any) { toast(e?.message || 'Upload failed', 'error') }
  }

  async function deleteProfilePicture() {
    if (!confirm('Remove your profile picture?')) return
    try { await useAuthStore().updateProfile({ avatar_url: null }); toast('Profile picture removed') }
    catch { toast('Failed to remove picture', 'error') }
  }

  // ==========================================
  // 4. BACKUPS (JSON)
  // ==========================================
  function exportBackup() {
    try {
      const chIds = new Set(channels.value.map(c => c.id))
      const cats = allWorkspaceCategories.value.filter(c => chIds.has(c.channel_id))
      const catIds = new Set(cats.map(c => c.id))
      const exTools = allWorkspaceTools.value.filter(t => catIds.has(t.category_id))
      const backup = { version: 2, channels: channels.value, categories: cats, tools: exTools, favorites: favoriteToolIds.value }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(currentWorkspace.value?.name || 'workspace').replace(/\s+/g, '_')}_Backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast('Backup downloaded')
    } catch { toast('Failed to export data', 'error') }
  }

  async function restoreBackup(json: any) {
    const userId = uid(); const ws = currentWorkspace.value
    if (!userId || !ws || !Array.isArray(json?.channels) || !Array.isArray(json?.categories) || !Array.isArray(json?.tools)) {
      return toast('Invalid backup file format.', 'error')
    }
    isFetching.value = true
    toast('Restoring backup…', 'info')
    try {
      const toolIdMap = new Map<string, string>()
      for (const oldCh of json.channels) {
        const { data: newCh, error: chErr } = await supabase.from('channels').insert({
          workspace_id: ws.id, user_id: userId, name: String(oldCh.name || 'Channel'), icon_url: oldCh.icon_url ?? null,
          sort_order: channels.value.length + (Number(oldCh.sort_order) || 0),
        }).select().single()
        if (chErr || !newCh) throw chErr || new Error('channel')
        const cats = json.categories.filter((c: any) => c.channel_id === oldCh.id)
        if (!cats.length) continue
        const { data: newCats, error: catErr } = await supabase.from('categories').insert(
          cats.map((c: any) => ({ channel_id: newCh.id, user_id: userId, name: String(c.name || 'Category'), sort_order: Number(c.sort_order) || 0 }))
        ).select()
        if (catErr || !newCats) throw catErr || new Error('categories')
        for (let i = 0; i < cats.length; i++) {
          const oldTools = json.tools.filter((t: any) => t.category_id === cats[i].id)
            .map((t: any) => ({ t, url: normalizeUrl(String(t.url || '')) })).filter((x: any) => x.url)
          if (!oldTools.length) continue
          const { data: newTools, error: toolErr } = await supabase.from('tools').insert(
            oldTools.map((x: any) => ({
              category_id: newCats[i].id, user_id: userId, name: String(x.t.name || x.url), url: x.url,
              logo_url: x.t.logo_url || getFaviconUrl(x.url), tags: Array.isArray(x.t.tags) ? x.t.tags : [], sort_order: Number(x.t.sort_order) || 0,
            }))
          ).select()
          if (toolErr || !newTools) throw toolErr || new Error('tools')
          newTools.forEach((nt: any, k: number) => toolIdMap.set(oldTools[k].t.id, nt.id))
        }
      }
      const favs = (Array.isArray(json.favorites) ? json.favorites : []).map((id: string) => toolIdMap.get(id)).filter(Boolean)
      if (favs.length) await supabase.from('favorites').insert(favs.map((tool_id: string) => ({ user_id: userId, tool_id })))
      await initWorkspace(true)
      toast('Backup restored!')
    } catch (e) {
      console.error(e)
      await initWorkspace(true)
      toast('Backup only partly restored. Check your data.', 'error')
    } finally { isFetching.value = false }
  }

  // ==========================================
  // 5. CHANNELS CRUD
  // ==========================================
  async function saveChannelOrder() {
    channels.value.forEach((c, i) => { c.sort_order = i })
    const results = await Promise.all(channels.value.map(c => supabase.from('channels').update({ sort_order: c.sort_order }).eq('id', c.id)))
    if (results.some(r => r.error)) toast('Could not save channel order', 'error')
  }

  async function uploadChannelIcon(file: File) {
    const userId = uid(); if (!userId) return null
    return uploadToBucket('channel-icons', `${userId}/${Date.now()}.${fileExt(file)}`, file)
  }

  async function addChannel(name: string, icon_url?: string) {
    const userId = uid(); const ws = currentWorkspace.value
    if (!ws || !userId) return
    const { data, error } = await supabase.from('channels').insert({ workspace_id: ws.id, user_id: userId, name, icon_url: icon_url || null, sort_order: channels.value.length }).select().single()
    if (error || !data) return toast('Failed to create channel.', 'error')
    channels.value.push(data as Channel)
    await setActiveChannel(data as Channel)
    toast('Channel created')
  }

  async function updateChannel(id: string, newName: string, icon_url?: string) {
    const payload: any = { name: newName }
    if (icon_url !== undefined) payload.icon_url = icon_url || null
    const { error } = await supabase.from('channels').update(payload).eq('id', id)
    if (error) return toast('Failed to update channel.', 'error')
    const apply = (c?: Channel | null) => { if (c) { c.name = newName; if (icon_url !== undefined) c.icon_url = icon_url || null } }
    apply(channels.value.find(c => c.id === id)); if (activeChannel.value?.id === id) apply(activeChannel.value)
    toast('Channel updated')
  }

  async function deleteChannel(id: string) {
    if (!confirm('Delete this channel and everything inside it?')) return
    const { error } = await supabase.from('channels').delete().eq('id', id)
    if (error) return toast('Failed to delete channel.', 'error')
    channels.value = channels.value.filter(c => c.id !== id)
    await fetchAllWorkspaceData()
    if (activeChannel.value?.id === id) { activeChannel.value = null; await setActiveChannel(channels.value[0] ?? null) }
    toast('Channel deleted')
  }

  // ==========================================
  // 6. CATEGORIES & TOOLS CRUD
  // ==========================================
  async function saveCategoryOrder() {
    categories.value.forEach((c, i) => { c.sort_order = i })
    const results = await Promise.all(categories.value.map(c => supabase.from('categories').update({ sort_order: c.sort_order }).eq('id', c.id)))
    if (results.some(r => r.error)) toast('Could not save category order', 'error')
  }

  async function saveToolOrder(_categoryId: string, ordered: Tool[]) {
    ordered.forEach((t, i) => {
      const a = tools.value.find(x => x.id === t.id); if (a) a.sort_order = i
      const b = allWorkspaceTools.value.find(x => x.id === t.id); if (b) b.sort_order = i
    })
    tools.value = [...tools.value].sort(bySort)
    const results = await Promise.all(ordered.map((t, i) => supabase.from('tools').update({ sort_order: i }).eq('id', t.id)))
    if (results.some(r => r.error)) toast('Could not save tool order', 'error')
  }

  async function addCategory(name: string) {
    const userId = uid(); const ch = activeChannel.value
    if (!ch || !userId) return
    const { data, error } = await supabase.from('categories').insert({ channel_id: ch.id, user_id: userId, name, sort_order: categories.value.length }).select().single()
    if (error || !data) return toast('Failed to add category', 'error')
    allWorkspaceCategories.value.push(data as Category)
    categories.value.push(data as Category)
    if (!activeCategory.value) { activeCategory.value = data as Category; tools.value = [] }
    toast('Category created')
  }

  async function updateCategory(id: string, newName: string) {
    const { error } = await supabase.from('categories').update({ name: newName }).eq('id', id)
    if (error) return toast('Failed to update category', 'error')
    const g = allWorkspaceCategories.value.find(c => c.id === id); if (g) g.name = newName
    const l = categories.value.find(c => c.id === id); if (l) l.name = newName
    if (activeCategory.value?.id === id) activeCategory.value.name = newName
    toast('Category updated')
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category and all tools inside it?')) return
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) return toast('Failed to delete category', 'error')
    allWorkspaceCategories.value = allWorkspaceCategories.value.filter(c => c.id !== id)
    categories.value = categories.value.filter(c => c.id !== id)
    allWorkspaceTools.value = allWorkspaceTools.value.filter(t => t.category_id !== id)
    if (activeCategory.value?.id === id) activeCategory.value = categories.value[0] ?? null
    loadCategoryTools()
    toast('Category deleted')
  }

  async function addTool(categoryId: string, data: { name: string; url: string; tags?: string[]; logo_url?: string }) {
    const userId = uid(); if (!userId) return false
    const sort_order = allWorkspaceTools.value.filter(t => t.category_id === categoryId).length
    const { data: row, error } = await supabase.from('tools').insert({ category_id: categoryId, user_id: userId, ...data, sort_order }).select().single()
    if (error || !row) { toast('Failed to add tool', 'error'); return false }
    allWorkspaceTools.value.push(row as Tool)
    if (activeCategory.value?.id === categoryId) tools.value.push(row as Tool)
    toast('Tool added')
    return true
  }

  async function updateTool(id: string, patch: { name: string; url: string; tags: string[]; logo_url?: string }) {
    const { error } = await supabase.from('tools').update(patch).eq('id', id)
    if (error) { toast('Failed to update tool', 'error'); return false }
    for (const list of [tools.value, allWorkspaceTools.value]) { const t = list.find(x => x.id === id); if (t) Object.assign(t, patch) }
    toast('Tool updated')
    return true
  }

  async function deleteTool(id: string) {
    if (!confirm('Delete this tool?')) return
    const { error } = await supabase.from('tools').delete().eq('id', id)
    if (error) return toast('Failed to delete tool', 'error')
    tools.value = tools.value.filter(t => t.id !== id)
    allWorkspaceTools.value = allWorkspaceTools.value.filter(t => t.id !== id)
    favoriteToolIds.value = favoriteToolIds.value.filter(f => f !== id)
    toast('Tool deleted')
  }

  // ==========================================
  // 7. FAVORITES & RECENTS
  // ==========================================
  async function toggleFavorite(toolId: string) {
    const userId = uid(); if (!userId) return
    const isFav = favoriteToolIds.value.includes(toolId)
    // Optimistic: instant heart, roll back on failure
    favoriteToolIds.value = isFav ? favoriteToolIds.value.filter(i => i !== toolId) : [...favoriteToolIds.value, toolId]
    const { error } = isFav
      ? await supabase.from('favorites').delete().eq('user_id', userId).eq('tool_id', toolId)
      : await supabase.from('favorites').insert({ user_id: userId, tool_id: toolId })
    if (error) {
      favoriteToolIds.value = isFav ? [...favoriteToolIds.value, toolId] : favoriteToolIds.value.filter(i => i !== toolId)
      toast('Could not update favorite', 'error')
    }
  }

  function trackOpen(toolId: string) {
    recentToolIds.value = [toolId, ...recentToolIds.value.filter(i => i !== toolId)].slice(0, 12)
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recentToolIds.value)) } catch { /* private mode */ }
  }

  return {
    currentWorkspace, channels, activeChannel, categories, activeCategory, tools,
    allWorkspaceTools, allWorkspaceCategories, favoriteToolIds, recentTools, isFetching, isInitializing, loadError,
    initWorkspace, reset, addChannel, updateChannel, deleteChannel, saveChannelOrder, saveCategoryOrder, uploadChannelIcon, saveToolOrder,
    setActiveChannel, setActiveCategory, addCategory, updateCategory, deleteCategory, addTool, updateTool, deleteTool,
    toggleFavorite, trackOpen, uploadLogo, deleteLogo, uploadWordmark, deleteWordmark, updateWorkspaceName,
    exportBackup, restoreBackup, uploadProfilePicture, deleteProfilePicture,
  }
})
