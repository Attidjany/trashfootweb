import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack } from 'expo-router';
import {
  Users,
  Trophy,
  Target,
  Activity,
  Search,
  Crown,
  TrendingUp,
  Eye,
  Play,
  Clock,
  CheckCircle,
  ChevronRight,
  Copy,
} from 'lucide-react-native';
import { createAdminDummyData } from '@/mocks/dummy-data';
import { AdminData, Group, Player } from '@/types/game';

type TabType = 'overview' | 'groups' | 'users' | 'matches' | 'activity';

const StatCard = ({ icon: Icon, title, value, subtitle, color = '#3B82F6' }: {
  icon: any;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statHeader}>
      <Icon size={24} color={color} />
      <Text style={styles.statTitle}>{title}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </View>
);

const GroupCard = ({ group, onPress, showInviteCode = false }: { group: Group; onPress?: () => void; showInviteCode?: boolean }) => {
  const activeCompetitions = group.competitions.filter(c => c.status === 'active').length;
  const totalMatches = group.competitions.reduce((sum, c) => sum + c.matches.length, 0);
  
  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(group.inviteCode);
      console.log(`Group code "${group.inviteCode}" copied to clipboard`);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{group.name}</Text>
          <Text style={styles.cardSubtitle}>{group.description}</Text>
          {showInviteCode && (
            <TouchableOpacity style={styles.inviteCodeContainer} onPress={handleCopyCode}>
              <Text style={styles.inviteCodeLabel}>Invite Code:</Text>
              <Text style={styles.inviteCodeText}>{group.inviteCode}</Text>
              <Copy size={14} color="#3B82F6" style={styles.copyIcon} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.badge}>
          <Crown size={16} color="#F59E0B" />
        </View>
      </View>
      <View style={styles.cardStats}>
        <View style={styles.cardStat}>
          <Users size={16} color="#6B7280" />
          <Text style={styles.cardStatText}>{group.members.length} members</Text>
        </View>
        <View style={styles.cardStat}>
          <Trophy size={16} color="#6B7280" />
          <Text style={styles.cardStatText}>{activeCompetitions} active</Text>
        </View>
        <View style={styles.cardStat}>
          <Target size={16} color="#6B7280" />
          <Text style={styles.cardStatText}>{totalMatches} matches</Text>
        </View>
      </View>
      <Text style={styles.cardDate}>
        Created {new Date(group.createdAt).toLocaleDateString()}
      </Text>
      {onPress && (
        <View style={styles.cardArrow}>
          <ChevronRight size={20} color="#6B7280" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const UserCard = ({ user, onPress, onBan, onSuspend, onDelete, onRestore }: { 
  user: Player; 
  onPress?: () => void;
  onBan?: () => void;
  onSuspend?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
}) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.cardHeader}>
      <View>
        <Text style={styles.cardTitle}>{user.name}</Text>
        <Text style={styles.cardSubtitle}>Win Rate: {user.stats.winRate.toFixed(1)}%</Text>
        <View style={styles.userStatusContainer}>
          <View style={[
            styles.statusBadge,
            {
              backgroundColor: user.status === 'active' ? '#10B981' :
                             user.status === 'suspended' ? '#F59E0B' : '#EF4444'
            }
          ]}>
            <Text style={styles.statusText}>{user.status?.toUpperCase() || 'ACTIVE'}</Text>
          </View>
          {user.role && user.role !== 'player' && (
            <View style={styles.roleBadge}>
              <Crown size={12} color="#F59E0B" />
              <Text style={styles.roleText}>{user.role.replace('_', ' ').toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={[styles.badge, { backgroundColor: user.stats.winRate > 60 ? '#10B981' : user.stats.winRate > 40 ? '#F59E0B' : '#EF4444' }]}>
        <TrendingUp size={16} color="white" />
      </View>
    </View>
    <View style={styles.cardStats}>
      <View style={styles.cardStat}>
        <Text style={styles.cardStatText}>{user.stats.played} played</Text>
      </View>
      <View style={styles.cardStat}>
        <Text style={styles.cardStatText}>{user.stats.wins}W</Text>
      </View>
      <View style={styles.cardStat}>
        <Text style={styles.cardStatText}>{user.stats.draws}D</Text>
      </View>
      <View style={styles.cardStat}>
        <Text style={styles.cardStatText}>{user.stats.losses}L</Text>
      </View>
    </View>
    <Text style={styles.cardDate}>
      Joined {new Date(user.joinedAt).toLocaleDateString()}
    </Text>
    
    {/* Admin Actions */}
    <View style={styles.adminActions}>
      {user.status === 'active' && onBan && (
        <TouchableOpacity style={[styles.adminButton, styles.banButton]} onPress={onBan}>
          <Text style={styles.adminButtonText}>Ban</Text>
        </TouchableOpacity>
      )}
      {user.status === 'active' && onSuspend && (
        <TouchableOpacity style={[styles.adminButton, styles.suspendButton]} onPress={onSuspend}>
          <Text style={styles.adminButtonText}>Suspend</Text>
        </TouchableOpacity>
      )}
      {(user.status === 'banned' || user.status === 'suspended') && onRestore && (
        <TouchableOpacity style={[styles.adminButton, styles.restoreButton]} onPress={onRestore}>
          <Text style={styles.adminButtonText}>Restore</Text>
        </TouchableOpacity>
      )}
      {onDelete && (
        <TouchableOpacity style={[styles.adminButton, styles.deleteButton]} onPress={onDelete}>
          <Text style={styles.adminButtonText}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
    
    {onPress && (
      <View style={styles.cardArrow}>
        <ChevronRight size={20} color="#6B7280" />
      </View>
    )}
  </TouchableOpacity>
);

const ActivityItem = ({ activity }: { activity: AdminData['recentActivity'][0] }) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'match_completed': return CheckCircle;
      case 'group_created': return Users;
      case 'user_joined': return TrendingUp;
      case 'competition_started': return Trophy;
      default: return Activity;
    }
  };
  
  const Icon = getIcon();
  
  return (
    <View style={styles.activityItem}>
      <View style={styles.activityIcon}>
        <Icon size={20} color="#6B7280" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        <Text style={styles.activityTime}>
          {new Date(activity.timestamp).toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const adminData = useMemo(() => createAdminDummyData(), []);
  
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return adminData.allGroups;
    return adminData.allGroups.filter(group => 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [adminData.allGroups, searchQuery]);
  
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return adminData.allUsers;
    return adminData.allUsers.filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [adminData.allUsers, searchQuery]);
  
  const allMatches = useMemo(() => {
    return adminData.allGroups.flatMap(g => 
      g.competitions.flatMap(c => 
        c.matches.map(m => ({ ...m, groupName: g.name, competitionName: c.name }))
      )
    );
  }, [adminData.allGroups]);
  
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Eye },
    { id: 'groups' as const, label: 'Groups', icon: Users },
    { id: 'users' as const, label: 'Users', icon: Crown },
    { id: 'matches' as const, label: 'Matches', icon: Target },
    { id: 'activity' as const, label: 'Activity', icon: Activity },
  ];
  
  const renderOverview = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Platform Statistics</Text>
      <View style={styles.statsGrid}>
        <StatCard
          icon={Users}
          title="Total Users"
          value={adminData.platformStats.totalUsers}
          subtitle="Registered players"
          color="#3B82F6"
        />
        <StatCard
          icon={Crown}
          title="Active Groups"
          value={adminData.platformStats.activeGroups}
          subtitle={`of ${adminData.platformStats.totalGroups} total`}
          color="#10B981"
        />
        <StatCard
          icon={Target}
          title="Total Matches"
          value={adminData.platformStats.totalMatches}
          subtitle={`${adminData.platformStats.completedMatches} completed`}
          color="#F59E0B"
        />
        <StatCard
          icon={Trophy}
          title="Competitions"
          value={adminData.platformStats.totalCompetitions}
          subtitle="Active tournaments"
          color="#8B5CF6"
        />
      </View>
      
      <View style={styles.matchStatusGrid}>
        <StatCard
          icon={Play}
          title="Live Matches"
          value={adminData.platformStats.liveMatches}
          color="#EF4444"
        />
        <StatCard
          icon={Clock}
          title="Scheduled"
          value={adminData.platformStats.scheduledMatches}
          color="#6B7280"
        />
      </View>
      
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityList}>
        {adminData.recentActivity.slice(0, 5).map((activity, index) => (
          <ActivityItem key={index} activity={activity} />
        ))}
      </View>
    </ScrollView>
  );
  
  const renderGroups = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
      <Text style={styles.sectionTitle}>All Groups ({filteredGroups.length})</Text>
      {filteredGroups.map(group => (
        <GroupCard 
          key={group.id} 
          group={group} 
          showInviteCode={true}
          onPress={() => console.log('Navigate to group:', group.name)}
        />
      ))}
    </ScrollView>
  );
  
  const handleBanUser = (userId: string) => {
    console.log('Banning user:', userId);
    // In a real app, this would call an API to ban the user
  };
  
  const handleSuspendUser = (userId: string) => {
    console.log('Suspending user:', userId);
    // In a real app, this would call an API to suspend the user
  };
  
  const handleDeleteUser = (userId: string) => {
    console.log('Deleting user:', userId);
    // In a real app, this would call an API to delete the user
  };
  
  const handleRestoreUser = (userId: string) => {
    console.log('Restoring user:', userId);
    // In a real app, this would call an API to restore the user
  };

  const renderUsers = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
      <Text style={styles.sectionTitle}>All Users ({filteredUsers.length})</Text>
      {filteredUsers.map(user => (
        <UserCard 
          key={user.id} 
          user={user} 
          onPress={() => console.log('Navigate to user:', user.name)}
          onBan={() => handleBanUser(user.id)}
          onSuspend={() => handleSuspendUser(user.id)}
          onDelete={() => handleDeleteUser(user.id)}
          onRestore={() => handleRestoreUser(user.id)}
        />
      ))}
    </ScrollView>
  );
  
  const renderMatches = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>All Matches ({allMatches.length})</Text>
      {allMatches.map(match => {
        const homePlayer = adminData.allUsers.find(u => u.id === match.homePlayerId);
        const awayPlayer = adminData.allUsers.find(u => u.id === match.awayPlayerId);
        
        return (
          <View key={match.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  {homePlayer?.name} vs {awayPlayer?.name}
                </Text>
                <Text style={styles.cardSubtitle}>{match.groupName} • {match.competitionName}</Text>
              </View>
              <View style={[
                styles.badge,
                {
                  backgroundColor: match.status === 'live' ? '#EF4444' :
                                 match.status === 'completed' ? '#10B981' : '#6B7280'
                }
              ]}>
                <Text style={styles.badgeText}>{match.status.toUpperCase()}</Text>
              </View>
            </View>
            
            {match.status === 'completed' && (
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>
                  {match.homeScore} - {match.awayScore}
                </Text>
              </View>
            )}
            
            <Text style={styles.cardDate}>
              {match.status === 'completed' && match.completedAt
                ? `Completed ${new Date(match.completedAt).toLocaleString()}`
                : `Scheduled ${new Date(match.scheduledTime).toLocaleString()}`
              }
            </Text>
            
            {match.youtubeLink && (
              <Text style={styles.youtubeLink}>🔴 Live: {match.youtubeLink}</Text>
            )}
            
            {/* Super Admin Actions */}
            <View style={styles.matchAdminActions}>
              <TouchableOpacity style={[styles.adminButton, styles.deleteButton]} onPress={() => console.log('Delete match:', match.id)}>
                <Text style={styles.adminButtonText}>Delete Match</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.adminButton, styles.restoreButton]} onPress={() => console.log('Restore match:', match.id)}>
                <Text style={styles.adminButtonText}>Restore Match</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
  
  const renderActivity = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityList}>
        {adminData.recentActivity.map((activity, index) => (
          <ActivityItem key={index} activity={activity} />
        ))}
      </View>
    </ScrollView>
  );
  
  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'groups': return renderGroups();
      case 'users': return renderUsers();
      case 'matches': return renderMatches();
      case 'activity': return renderActivity();
      default: return renderOverview();
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Admin Dashboard',
          headerStyle: { backgroundColor: '#1F2937' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabContainer}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, isActive && styles.activeTab]}
                  onPress={() => {
                    setActiveTab(tab.id);
                    setSearchQuery('');
                  }}
                >
                  <Icon
                    size={20}
                    color={isActive ? '#3B82F6' : '#6B7280'}
                  />
                  <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
      
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  activeTab: {
    backgroundColor: '#EBF4FF',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  matchStatusGrid: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  badge: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardStats: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  cardStatText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  cardDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  youtubeLink: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  inviteCodeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3B82F6',
    letterSpacing: 1,
    flex: 1,
  },
  copyIcon: {
    marginLeft: 8,
  },
  userStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#fff',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#F59E0B',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  adminButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  banButton: {
    backgroundColor: '#DC2626',
  },
  suspendButton: {
    backgroundColor: '#F59E0B',
  },
  deleteButton: {
    backgroundColor: '#7C2D12',
  },
  restoreButton: {
    backgroundColor: '#10B981',
  },
  adminButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#fff',
  },
  matchAdminActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  groupAdminActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
});