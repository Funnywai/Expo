import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Surface } from 'react-native-paper';
import type { UserData, LaCounts, GameState } from '../types';

interface ScoreAnalyticsDashboardProps {
  users: UserData[];
  history: GameState[];
  totalScores: { [key: number]: number };
  laCounts: LaCounts;
  currentWinnerId: number | null;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const screenWidth = Dimensions.get('window').width;

export function ScoreAnalyticsDashboard({
  users,
  history,
  totalScores,
  laCounts,
  currentWinnerId,
}: ScoreAnalyticsDashboardProps) {
  // Calculate cumulative scores over time for the line chart
  const scoreHistory = useMemo(() => {
    const cumulativeScores: { [key: number]: number } = {};
    users.forEach(u => cumulativeScores[u.id] = 0);

    return history.map((state, index) => {
      const dataPoint: any = { round: index + 1 };
      state.scoreChanges.forEach(change => {
        cumulativeScores[change.userId] += change.change;
        const user = users.find(u => u.id === change.userId);
        if (user) {
          dataPoint[user.name] = cumulativeScores[change.userId];
        }
      });
      return dataPoint;
    });
  }, [history, users]);

  // Calculate win distribution
  const winDistribution = useMemo(() => {
    const wins: { [key: number]: number } = {};
    users.forEach(u => wins[u.id] = 0);

    history.forEach(state => {
      state.scoreChanges.forEach(change => {
        if (change.change > 0) {
          wins[change.userId]++;
        }
      });
    });

    return users.map(user => ({
      name: user.name,
      wins: wins[user.id],
    })).filter(d => d.wins > 0);
  }, [history, users]);

  // Calculate player statistics
  const playerStats = useMemo(() => {
    const stats: {
      [key: number]: {
        name: string;
        totalWins: number;
        totalScore: number;
        avgScore: number;
        maxRound: number;
        minRound: number;
        consistency: number;
        winPercentage: number;
        rounds: number[];
      };
    } = {};

    users.forEach(u => {
      stats[u.id] = {
        name: u.name,
        totalWins: 0,
        totalScore: totalScores[u.id] || 0,
        avgScore: 0,
        maxRound: 0,
        minRound: 0,
        consistency: 0,
        winPercentage: 0,
        rounds: [],
      };
    });

    let totalRounds = 0;
    let userRoundCount: { [key: number]: number } = {};
    users.forEach(u => userRoundCount[u.id] = 0);

    history.forEach(state => {
      totalRounds++;
      state.scoreChanges.forEach(change => {
        stats[change.userId].rounds.push(change.change);
        userRoundCount[change.userId]++;
        if (change.change > 0) {
          stats[change.userId].totalWins++;
        }
      });
    });

    Object.entries(stats).forEach(([userId, stat]) => {
      const id = parseInt(userId);
      if (stat.rounds.length > 0) {
        stat.avgScore = Math.round(stat.totalScore / stat.rounds.length);
        stat.maxRound = Math.max(...stat.rounds);
        stat.minRound = Math.min(...stat.rounds);
        stat.winPercentage = Math.round((stat.totalWins / totalRounds) * 100);
        
        // Calculate consistency (lower std dev = more consistent)
        const mean = stat.avgScore;
        const variance = stat.rounds.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / stat.rounds.length;
        stat.consistency = Math.round(Math.sqrt(variance));
      }
    });

    return stats;
  }, [users, history, totalScores]);

  // Rank players by total score
  const rankedPlayers = useMemo(() => {
    return users
      .map(u => ({
        id: u.id,
        name: u.name,
        score: totalScores[u.id] || 0,
        stats: playerStats[u.id],
      }))
      .sort((a, b) => b.score - a.score);
  }, [users, totalScores, playerStats]);

  // Prepare pie chart data
  const pieData = useMemo(() => {
    return winDistribution.map((d, idx) => ({
      ...d,
      value: d.wins,
    }));
  }, [winDistribution]);

  // Simple bar chart component
  const SimpleBarChart = ({ data }: { data: { name: string; value: number }[] }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
      <View style={styles.chartContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.barItem}>
            <Text style={styles.barLabel}>{item.name}</Text>
            <View style={styles.barBackground}>
              <View 
                style={[
                  styles.barFill, 
                  { 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: COLORS[index % COLORS.length]
                  }
                ]} 
              />
            </View>
            <Text style={styles.barValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Simple pie chart component (as a horizontal bar representation)
  const SimplePieChart = ({ data }: { data: { name: string; value: number }[] }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return (
      <View style={styles.pieContainer}>
        <View style={styles.pieBar}>
          {data.map((item, index) => (
            <View
              key={index}
              style={[
                styles.pieSegment,
                {
                  width: `${(item.value / total) * 100}%`,
                  backgroundColor: COLORS[index % COLORS.length],
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.pieLegend}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendColor, 
                  { backgroundColor: COLORS[index % COLORS.length] }
                ]} 
              />
              <Text style={styles.legendText}>
                {item.name}: {item.value} ({Math.round((item.value / total) * 100)}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Simple line chart component
  const SimpleLineChart = ({ data, users }: { data: any[]; users: UserData[] }) => {
    if (data.length === 0) return null;

    // Find min and max scores across all users
    let minScore = 0;
    let maxScore = 0;
    data.forEach(point => {
      users.forEach(user => {
        const score = point[user.name];
        if (score !== undefined) {
          minScore = Math.min(minScore, score);
          maxScore = Math.max(maxScore, score);
        }
      });
    });

    const range = maxScore - minScore || 1;
    const chartHeight = 200;
    const chartWidth = Math.max(screenWidth - 80, data.length * 40);
    const pointWidth = chartWidth / (data.length - 1 || 1);

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.lineChartScroll}>
        <View style={[styles.lineChartContainer, { width: chartWidth, height: chartHeight }]}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction, i) => {
            const y = chartHeight - (fraction * chartHeight);
            const value = Math.round(minScore + (range * fraction));
            return (
              <View key={i} style={[styles.gridLine, { top: y }]}>
                <Text style={styles.gridLabel}>{value}</Text>
              </View>
            );
          })}

          {/* Draw lines for each user */}
          {users.map((user, userIndex) => {
            const points: { x: number; y: number }[] = [];
            data.forEach((point, index) => {
              const score = point[user.name];
              if (score !== undefined) {
                const x = index * pointWidth;
                const y = chartHeight - ((score - minScore) / range) * chartHeight;
                points.push({ x, y });
              }
            });

            return (
              <View key={user.id} style={styles.lineLayer}>
                {points.map((point, i) => {
                  if (i === 0) return null;
                  const prevPoint = points[i - 1];
                  const dx = point.x - prevPoint.x;
                  const dy = point.y - prevPoint.y;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx);

                  return (
                    <View
                      key={i}
                      style={[
                        styles.lineSegment,
                        {
                          left: prevPoint.x,
                          top: prevPoint.y,
                          width: length,
                          backgroundColor: COLORS[userIndex % COLORS.length],
                          transform: [{ rotate: `${angle}rad` }],
                        },
                      ]}
                    />
                  );
                })}
                {points.map((point, i) => (
                  <View
                    key={`dot-${i}`}
                    style={[
                      styles.lineDot,
                      {
                        left: point.x - 4,
                        top: point.y - 4,
                        backgroundColor: COLORS[userIndex % COLORS.length],
                      },
                    ]}
                  />
                ))}
              </View>
            );
          })}

          {/* Round labels */}
          <View style={styles.xAxisLabels}>
            {data.map((point, index) => (
              <Text 
                key={index} 
                style={[
                  styles.xAxisLabel, 
                  { left: index * pointWidth - 10 }
                ]}
              >
                R{point.round}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Leaderboard */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🏆 LEADERBOARD</Text>
        </View>
        <View style={styles.leaderboardGrid}>
          {rankedPlayers.map((player, index) => (
            <Card key={player.id} style={[styles.leaderboardCard, { borderLeftColor: COLORS[index % COLORS.length], borderLeftWidth: 4 }]}>
              <Card.Content>
                <View style={styles.leaderboardHeader}>
                  <View style={[styles.rankBadge, { backgroundColor: COLORS[index % COLORS.length] }]}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <Title style={styles.playerName}>{player.name}</Title>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={styles.totalScore}>{player.score.toLocaleString()}</Text>
                  <Text style={styles.scoreLabel}>Total Score</Text>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{player.stats.totalWins}</Text>
                    <Text style={styles.statLabel}>WINS</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{player.stats.winPercentage}%</Text>
                    <Text style={styles.statLabel}>WIN %</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </View>

      {/* Score Trajectory */}
      {scoreHistory.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>📈 SCORE TRAJECTORY</Text>
              <Text style={styles.cardSubtitle}>Track cumulative performance across all rounds</Text>
            </View>
            <View style={styles.legendContainer}>
              {users.map((user, index) => (
                <View key={user.id} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: COLORS[index % COLORS.length] }]} />
                  <Text style={styles.legendText}>{user.name}</Text>
                </View>
              ))}
            </View>
            <SimpleLineChart data={scoreHistory} users={users} />
          </Card.Content>
        </Card>
      )}

      {/* Win Distribution & Stats */}
      <View style={styles.twoColumnGrid}>
        {/* Win Distribution */}
        {pieData.length > 0 && (
          <Card style={styles.halfCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>🏆 Win Distribution</Text>
              <SimplePieChart data={pieData} />
            </Card.Content>
          </Card>
        )}

        {/* Average Score by Player */}
        {winDistribution.length > 0 && (
          <Card style={styles.halfCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>🎯 Avg Score/Round</Text>
              <SimpleBarChart
                data={users.map(u => ({
                  name: u.name,
                  value: playerStats[u.id]?.avgScore || 0,
                }))}
              />
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Performance Metrics */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>⚡ PERFORMANCE METRICS</Text>
          <View style={styles.metricsGrid}>
            {rankedPlayers.map((player) => {
              const stats = player.stats;
              return (
                <Surface key={player.id} style={styles.metricCard}>
                  <Text style={styles.metricPlayerName}>{player.name}</Text>
                  <View style={styles.metricRows}>
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Total:</Text>
                      <Text style={[styles.metricValue, styles.metricPrimary]}>{stats.totalScore}</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Avg:</Text>
                      <Text style={styles.metricValue}>{stats.avgScore}</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Best:</Text>
                      <Text style={[styles.metricValue, styles.metricGreen]}>↑{stats.maxRound}</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Worst:</Text>
                      <Text style={[styles.metricValue, styles.metricRed]}>↓{stats.minRound}</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Rounds:</Text>
                      <Text style={styles.metricValue}>{stats.rounds.length}</Text>
                    </View>
                  </View>
                </Surface>
              );
            })}
          </View>
        </Card.Content>
      </Card>

      {/* Recent Games Timeline */}
      {history.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>📜 RECENT GAMES</Text>
              <Text style={styles.cardSubtitle}>
                {history.length} round{history.length !== 1 ? 's' : ''} played
              </Text>
            </View>
            <FlatList
              data={[...history].reverse()}
              scrollEnabled={false}
              keyExtractor={(_, index) => `game-${index}`}
              renderItem={({ item: game, index }) => (
                <View style={styles.gameItem}>
                  <Surface style={styles.roundBadge}>
                    <Text style={styles.roundText}>Round {history.length - index}</Text>
                  </Surface>
                  <View style={styles.gameContent}>
                    <Text style={styles.gameAction}>{game.action}</Text>
                    <View style={styles.scoreChanges}>
                      {game.scoreChanges.map((change) => {
                        const user = users.find(u => u.id === change.userId);
                        const sign = change.change >= 0 ? '+' : '';
                        const color = change.change >= 0 ? styles.positiveScore : styles.negativeScore;
                        return (
                          <Text key={change.userId} style={[styles.scoreChange, color]}>
                            {user?.name}: {sign}{change.change}
                          </Text>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}
            />
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  leaderboardGrid: {
    gap: 16,
  },
  leaderboardCard: {
    marginBottom: 12,
    elevation: 4,
  },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreContainer: {
    marginBottom: 12,
  },
  totalScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  twoColumnGrid: {
    gap: 16,
    marginBottom: 16,
  },
  halfCard: {
    marginBottom: 16,
    elevation: 4,
  },
  chartContainer: {
    paddingVertical: 16,
  },
  barItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 80,
    fontSize: 12,
    fontWeight: 'bold',
  },
  barBackground: {
    flex: 1,
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    width: 40,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  pieContainer: {
    paddingVertical: 16,
  },
  pieBar: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  pieSegment: {
    height: '100%',
  },
  pieLegend: {
    gap: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lineChartScroll: {
    marginVertical: 16,
  },
  lineChartContainer: {
    position: 'relative',
    paddingLeft: 40,
    paddingBottom: 30,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLabel: {
    position: 'absolute',
    left: 0,
    fontSize: 10,
    color: '#666',
    width: 35,
  },
  lineLayer: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 0,
    bottom: 30,
  },
  lineSegment: {
    position: 'absolute',
    height: 3,
    transformOrigin: '0 0',
  },
  lineDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: 0,
    left: 40,
    right: 0,
    height: 30,
  },
  xAxisLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#666',
    width: 30,
    textAlign: 'center',
  },
  metricsGrid: {
    gap: 12,
    marginTop: 12,
  },
  metricCard: {
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  metricPlayerName: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  metricRows: {
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  metricDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  metricPrimary: {
    color: '#3b82f6',
  },
  metricGreen: {
    color: '#10b981',
  },
  metricRed: {
    color: '#ef4444',
  },
  gameItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginBottom: 12,
  },
  roundBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#dbeafe',
    alignSelf: 'flex-start',
    marginRight: 12,
    elevation: 1,
  },
  roundText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  gameContent: {
    flex: 1,
  },
  gameAction: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreChanges: {
    gap: 4,
  },
  scoreChange: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  positiveScore: {
    color: '#10b981',
  },
  negativeScore: {
    color: '#ef4444',
  },
});
