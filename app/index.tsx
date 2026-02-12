import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button, Card, DataTable, Portal, Dialog, Switch, Menu, Divider, SegmentedButtons } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserData, LaCounts, ScoreChange, GameState } from '@/src/types';
import { RenameDialog } from '@/src/components/dialogs/rename-dialog';
import { WinActionDialog } from '@/src/components/dialogs/win-action-dialog';
import { SpecialActionDialog } from '@/src/components/dialogs/special-action-dialog';
import { MultiHitDialog } from '@/src/components/dialogs/multi-hit-dialog';
import { HistoryDialog } from '@/src/components/dialogs/history-dialog';
import { SeatChangeDialog } from '@/src/components/dialogs/seat-change-dialog';
import { ResetScoresDialog } from '@/src/components/dialogs/reset-scores-dialog';
import { PayoutDialog } from '@/src/components/dialogs/payout-dialog';

const generateInitialUsers = (): UserData[] => {
  const userCount = 4;
  return Array.from({ length: userCount }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    winValues: {},
  }));
};

const initialUsers = generateInitialUsers();

interface Payouts {
  [opponentId: number]: number;
}

interface ScoresToResetEntry {
  previousWinnerName: string;
  previousWinnerId: number;
  scores: { [opponentId: number]: number };
}

interface ScoresToReset {
  currentWinnerName: string;
  currentWinnerId: number;
  winners: ScoresToResetEntry[];
}

export default function Index() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentView, setCurrentView] = useState<'game' | 'analytics'>('game');

  // Load initial data from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedUsers, savedHistory, savedDealerId, savedConsecutiveWins, savedWinnerId, savedLaCounts, savedPopOnNewWinner] = await Promise.all([
          AsyncStorage.getItem('mahjong-users'),
          AsyncStorage.getItem('mahjong-history'),
          AsyncStorage.getItem('mahjong-dealerId'),
          AsyncStorage.getItem('mahjong-consecutiveWins'),
          AsyncStorage.getItem('mahjong-currentWinnerId'),
          AsyncStorage.getItem('mahjong-laCounts'),
          AsyncStorage.getItem('mahjong-popOnNewWinner'),
        ]);

        if (savedUsers) setUsers(JSON.parse(savedUsers));
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        if (savedDealerId) setDealerId(JSON.parse(savedDealerId));
        if (savedConsecutiveWins) setConsecutiveWins(JSON.parse(savedConsecutiveWins));
        if (savedWinnerId) setCurrentWinnerId(JSON.parse(savedWinnerId));
        if (savedLaCounts) setLaCounts(JSON.parse(savedLaCounts));
        if (savedPopOnNewWinner) setPopOnNewWinner(JSON.parse(savedPopOnNewWinner));

        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [history, setHistory] = useState<GameState[]>([]);
  const [dealerId, setDealerId] = useState<number>(1);
  const [consecutiveWins, setConsecutiveWins] = useState<number>(1);
  const [currentWinnerId, setCurrentWinnerId] = useState<number | null>(null);
  const [laCounts, setLaCounts] = useState<LaCounts>({});
  const [popOnNewWinner, setPopOnNewWinner] = useState<boolean>(true);

  // Dialog states
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isWinActionDialogOpen, setIsWinActionDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isSeatChangeDialogOpen, setIsSeatChangeDialogOpen] = useState(false);
  const [isResetScoresDialogOpen, setIsResetScoresDialogOpen] = useState(false);
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [isSpecialActionDialogOpen, setIsSpecialActionDialogOpen] = useState(false);
  const [isMultiHitDialogOpen, setIsMultiHitDialogOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const [currentUserForWinAction, setCurrentUserForWinAction] = useState<UserData | null>(null);
  const [currentUserForSpecialAction, setCurrentUserForSpecialAction] = useState<UserData | null>(null);
  const [multiHitInitialLoserId, setMultiHitInitialLoserId] = useState<number | null>(null);
  const [scoresToReset, setScoresToReset] = useState<ScoresToReset | null>(null);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('mahjong-popOnNewWinner', JSON.stringify(popOnNewWinner));
    }
  }, [isLoaded, popOnNewWinner]);

  const saveGameData = async (data: {
    users?: UserData[];
    history?: GameState[];
    dealerId?: number;
    consecutiveWins?: number;
    currentWinnerId?: number | null;
    laCounts?: LaCounts;
  }) => {
    try {
      const promises = [];
      if (data.users !== undefined) promises.push(AsyncStorage.setItem('mahjong-users', JSON.stringify(data.users)));
      if (data.history !== undefined) promises.push(AsyncStorage.setItem('mahjong-history', JSON.stringify(data.history)));
      if (data.dealerId !== undefined) promises.push(AsyncStorage.setItem('mahjong-dealerId', JSON.stringify(data.dealerId)));
      if (data.consecutiveWins !== undefined) promises.push(AsyncStorage.setItem('mahjong-consecutiveWins', JSON.stringify(data.consecutiveWins)));
      if (data.laCounts !== undefined) promises.push(AsyncStorage.setItem('mahjong-laCounts', JSON.stringify(data.laCounts)));
      if (data.currentWinnerId !== undefined) promises.push(AsyncStorage.setItem('mahjong-currentWinnerId', JSON.stringify(data.currentWinnerId)));
      await Promise.all(promises);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const saveStateToHistory = (action: string, scoreChanges: ScoreChange[], currentState: Omit<GameState, 'action' | 'scoreChanges'>) => {
    const newHistoryEntry: GameState = {
      ...currentState,
      action,
      scoreChanges,
    };
    const newHistory = [...history, newHistoryEntry];
    setHistory(newHistory);
    return newHistory;
  };

  const handleSetDealer = (userId: number) => {
    const newConsecutiveWins = 1;
    setDealerId(userId);
    setConsecutiveWins(newConsecutiveWins);
    saveGameData({
      dealerId: userId,
      consecutiveWins: newConsecutiveWins,
    });
  };

  const handleManualConsecutiveWin = () => {
    const newConsecutiveWins = consecutiveWins + 1;
    setConsecutiveWins(newConsecutiveWins);
    saveGameData({
      consecutiveWins: newConsecutiveWins,
    });
  };

  const handleOpenWinActionDialog = (user: UserData) => {
    setCurrentUserForWinAction(user);
    setIsWinActionDialogOpen(true);
  };

  const handleOpenSpecialActionDialog = (user?: UserData) => {
    setCurrentUserForSpecialAction(user ?? users[0] ?? null);
    setIsSpecialActionDialogOpen(true);
  };

  const handleLaunchMultiHit = (loserId?: number) => {
    setMultiHitInitialLoserId(loserId ?? null);
    setIsMultiHitDialogOpen(true);
  };

  const handleLaunchMultiHitFromWinFlow = (loserId?: number) => {
    handleLaunchMultiHit(loserId);
    setIsWinActionDialogOpen(false);
  };

  const handleExecuteZhaHuAction = (mainUserId: number, payouts: Payouts) => {
    const currentStateForHistory: Omit<GameState, 'action' | 'scoreChanges'> = {
      users: JSON.parse(JSON.stringify(users)),
      laCounts: JSON.parse(JSON.stringify(laCounts)),
      currentWinnerId,
      dealerId,
      consecutiveWins,
    };

    const mainUser = users.find(u => u.id === mainUserId);
    if (!mainUser) return;

    let totalPayout = 0;
    const scoreChanges: ScoreChange[] = [];

    Object.entries(payouts).forEach(([opponentId, amount]) => {
      const opponentIdNum = parseInt(opponentId, 10);
      if (amount > 0) {
        totalPayout += amount;
        scoreChanges.push({ userId: opponentIdNum, change: amount });
      }
    });

    scoreChanges.push({ userId: mainUserId, change: -totalPayout });

    const payoutDescriptions = Object.entries(payouts)
      .map(([id, amt]) => `${users.find(u => u.id === parseInt(id))?.name}: ${amt}`)
      .join(', ');
    const actionDescription = `${mainUser.name} 炸胡, pays out: ${payoutDescriptions}`;

    const newHistory = saveStateToHistory(actionDescription, scoreChanges, currentStateForHistory);

    saveGameData({
      history: newHistory,
    });

    setIsSpecialActionDialogOpen(false);
  };

  const handleExecuteSpecialAction = (mainUserId: number, actionType: 'collect' | 'pay', amount: number) => {
    const currentStateForHistory: Omit<GameState, 'action' | 'scoreChanges'> = {
      users: JSON.parse(JSON.stringify(users)),
      laCounts: JSON.parse(JSON.stringify(laCounts)),
      currentWinnerId,
      dealerId,
      consecutiveWins,
    };

    const mainUser = users.find(u => u.id === mainUserId);
    if (!mainUser) return;

    const scoreChanges: ScoreChange[] = [];
    const opponentIds = users.filter(u => u.id !== mainUserId).map(u => u.id);

    let mainUserChange = 0;
    let actionDescription = '';

    if (actionType === 'collect') {
      mainUserChange = amount * opponentIds.length;
      opponentIds.forEach(id => scoreChanges.push({ userId: id, change: -amount }));
      actionDescription = `${mainUser.name} 收 ${amount} 番`;
    } else {
      mainUserChange = -amount * opponentIds.length;
      opponentIds.forEach(id => scoreChanges.push({ userId: id, change: amount }));
      actionDescription = `${mainUser.name} 賠 ${amount} 番`;
    }

    scoreChanges.push({ userId: mainUserId, change: mainUserChange });

    const newHistory = saveStateToHistory(actionDescription, scoreChanges, currentStateForHistory);

    saveGameData({
      history: newHistory,
    });

    setIsSpecialActionDialogOpen(false);
  };

  const handleWin = (winnerId: number, currentDealerId: number, currentConsecutiveWins: number) => {
    if (winnerId === currentDealerId) {
      return { newDealerId: currentDealerId, newConsecutiveWins: currentConsecutiveWins + 1 };
    } else {
      const currentDealerIndex = users.findIndex(u => u.id === currentDealerId);
      const nextDealerIndex = (currentDealerIndex + 1) % users.length;
      return { newDealerId: users[nextDealerIndex].id, newConsecutiveWins: 1 };
    }
  };

  const updateLaCounts = (winnerId: number, loserIds: number[], currentLaCounts: LaCounts, currentWinnerId: number | null) => {
    let newLaCounts: LaCounts;

    if (winnerId === currentWinnerId) {
      newLaCounts = {};
      if (currentLaCounts[winnerId]) {
        newLaCounts[winnerId] = { ...currentLaCounts[winnerId] };
      }
    } else {
      newLaCounts = {};
    }

    if (!newLaCounts[winnerId]) {
      newLaCounts[winnerId] = {};
    }

    loserIds.forEach(loserId => {
      newLaCounts[winnerId][loserId] = (newLaCounts[winnerId]?.[loserId] || 0) + 1;
    });

    return newLaCounts;
  };

  const executeWinAction = (
    mainUserId: number,
    value: number,
    targetUserId?: number
  ) => {
    const currentStateForHistory: Omit<GameState, 'action' | 'scoreChanges'> = {
      users: JSON.parse(JSON.stringify(users)),
      laCounts: JSON.parse(JSON.stringify(laCounts)),
      currentWinnerId,
      dealerId,
      consecutiveWins,
    };

    const usersWithActiveWinValues = users.filter(
      u => u.id !== mainUserId && Object.values(u.winValues).some(score => score > 0)
    );
    const hasOtherUsersWithScores = usersWithActiveWinValues.length > 0;

    const isNewWinner = hasOtherUsersWithScores;
    const currentWinner = users.find(u => u.id === mainUserId);
    if (isNewWinner && popOnNewWinner) {
      const winnersToReset = usersWithActiveWinValues
        .filter(previousWinner => Object.values(previousWinner.winValues).some(score => score > 0))
        .map(previousWinner => ({
          previousWinnerName: previousWinner.name,
          previousWinnerId: previousWinner.id,
          scores: previousWinner.winValues,
        }));

      if (winnersToReset.length > 0) {
        setScoresToReset({
          currentWinnerName: currentWinner?.name || '',
          currentWinnerId: mainUserId,
          winners: winnersToReset,
        });
        setIsResetScoresDialogOpen(true);
      }
    }

    let finalUsers: UserData[];
    let actionDescription: string;
    let scoreChanges: ScoreChange[];
    let newLaCounts: LaCounts;

    if (targetUserId) {
      // "食胡" case
      const winner = users.find(u => u.id === mainUserId);
      const loser = users.find(u => u.id === targetUserId);
      actionDescription = `${winner?.name} 食胡 ${loser?.name} ${value}番`;

      let currentScore = value;
      const dealerBonus = 2 * consecutiveWins - 1;

      if (mainUserId === dealerId) {
        currentScore += dealerBonus;
      } else if (targetUserId === dealerId) {
        currentScore += dealerBonus;
      }

      let finalValue = currentScore;

      const previousScore = winner?.winValues[targetUserId] || 0;
      if (previousScore > 0) {
        const bonus = Math.round(previousScore * 0.5);
        finalValue = previousScore + bonus + currentScore;
      }

      if (isNewWinner) {
        const loserUser = users.find(u => u.id === targetUserId);
        const previousScoreOnWinner = loserUser?.winValues[mainUserId] || 0;
        if (previousScoreOnWinner > 0) {
          finalValue = Math.floor(previousScoreOnWinner / 2) + currentScore;
        }
      }

      const changeAmount = finalValue - (users.find(u => u.id === mainUserId)?.winValues[targetUserId] || 0);
      scoreChanges = [
        { userId: mainUserId, change: changeAmount },
        { userId: targetUserId, change: -changeAmount },
      ];

      newLaCounts = updateLaCounts(mainUserId, [targetUserId], laCounts, currentWinnerId);

      finalUsers = users.map(user => {
        if (isNewWinner && user.id !== mainUserId) {
          return { ...user, winValues: {} };
        }
        return user;
      }).map(user => {
        if (user.id === mainUserId) {
          const newWinValues = isNewWinner ? {} : { ...user.winValues };
          newWinValues[targetUserId] = finalValue;

          if (isNewWinner) {
            Object.keys(newWinValues).forEach(key => {
              if (parseInt(key) !== targetUserId) {
                newWinValues[parseInt(key)] = 0;
              }
            });
          }
          return { ...user, winValues: newWinValues };
        }
        if (user.id !== mainUserId) {
          const newWinValues = { ...user.winValues };
          if (newWinValues[mainUserId]) {
            newWinValues[mainUserId] = 0;
          }
          return { ...user, winValues: newWinValues };
        }
        return user;
      });

    } else {
      // "自摸" case
      const winner = users.find(u => u.id === mainUserId);
      actionDescription = `${winner?.name} 自摸 ${value}番`;
      const opponentIds = users.filter(u => u.id !== mainUserId).map(u => u.id);

      const isDealerWinning = mainUserId === dealerId;
      const dealerBonus = 2 * consecutiveWins - 1;

      const scoresToAdd: { [opponentId: number]: number } = {};
      let winnerTotalChange = 0;
      const currentScoreChanges: ScoreChange[] = [];

      opponentIds.forEach(opponentId => {
        let currentScore = value;
        if (isDealerWinning) {
          currentScore += dealerBonus;
        } else if (opponentId === dealerId) {
          currentScore += dealerBonus;
        }

        let finalValue = currentScore;

        const previousScore = winner?.winValues[opponentId] || 0;
        if (previousScore > 0) {
          const bonus = Math.round(previousScore * 0.5);
          finalValue = previousScore + bonus + currentScore;
        } else if (isNewWinner) {
          const opponentUser = users.find(u => u.id === opponentId);
          const previousScoreOnWinner = opponentUser?.winValues[mainUserId] || 0;
          if (previousScoreOnWinner > 0) {
            finalValue = Math.floor(previousScoreOnWinner / 2) + currentScore;
          }
        }

        const change = finalValue - (winner?.winValues[opponentId] || 0);
        scoresToAdd[opponentId] = finalValue;
        winnerTotalChange += change;
        currentScoreChanges.push({ userId: opponentId, change: -change });
      });
      currentScoreChanges.push({ userId: mainUserId, change: winnerTotalChange });
      scoreChanges = currentScoreChanges;

      newLaCounts = updateLaCounts(mainUserId, opponentIds, laCounts, currentWinnerId);

      finalUsers = users.map(user => {
        if (isNewWinner && user.id !== mainUserId) {
          return { ...user, winValues: {} };
        }
        return user;
      }).map(user => {
        if (user.id === mainUserId) {
          const newWinValues = isNewWinner ? {} : { ...user.winValues };
          Object.entries(scoresToAdd).forEach(([opponentId, score]) => {
            newWinValues[parseInt(opponentId)] = score;
          });
          return { ...user, winValues: newWinValues };
        }
        if (user.id !== mainUserId) {
          const newWinValues = { ...user.winValues };
          if (newWinValues[mainUserId]) {
            newWinValues[mainUserId] = 0;
          }
          return { ...user, winValues: newWinValues };
        }
        return user;
      });
    }

    const { newDealerId, newConsecutiveWins } = handleWin(mainUserId, dealerId, consecutiveWins);

    setUsers(finalUsers);
    setLaCounts(newLaCounts);
    setCurrentWinnerId(mainUserId);
    setDealerId(newDealerId);
    setConsecutiveWins(newConsecutiveWins);

    const newHistory = saveStateToHistory(actionDescription, scoreChanges, currentStateForHistory);

    saveGameData({
      users: finalUsers,
      history: newHistory,
      dealerId: newDealerId,
      consecutiveWins: newConsecutiveWins,
      currentWinnerId: mainUserId,
      laCounts: newLaCounts,
    });

    setIsWinActionDialogOpen(false);
  };

  const handleSaveWinAction = (mainUserId: number, value: number, targetUserId?: number) => {
    executeWinAction(mainUserId, value, targetUserId);
  };

  const handleExecuteMultiHitAction = (loserUserId: number, winnerIds: number[], winnerValues: Record<number, number>) => {
    if (winnerIds.length < 2 || winnerIds.length > 3) return;

    const currentStateForHistory: Omit<GameState, 'action' | 'scoreChanges'> = {
      users: JSON.parse(JSON.stringify(users)),
      laCounts: JSON.parse(JSON.stringify(laCounts)),
      currentWinnerId,
      dealerId,
      consecutiveWins,
    };

    const loser = users.find(u => u.id === loserUserId);
    if (!loser) return;

    const firstWinnerId = winnerIds[0];

    const usersWithActiveWinValues = users.filter(
      u => !winnerIds.includes(u.id) && Object.values(u.winValues).some(score => score > 0)
    );
    const hasOtherUsersWithScores = usersWithActiveWinValues.length > 0;

    if (hasOtherUsersWithScores && popOnNewWinner) {
      const winnersToReset = usersWithActiveWinValues
        .filter(previousWinner => Object.values(previousWinner.winValues).some(score => score > 0))
        .map(previousWinner => ({
          previousWinnerName: previousWinner.name,
          previousWinnerId: previousWinner.id,
          scores: previousWinner.winValues,
        }));

      if (winnersToReset.length > 0) {
        const winnerNames = winnerIds.map(id => users.find(u => u.id === id)?.name).join(' & ');
        setScoresToReset({
          currentWinnerName: winnerNames,
          currentWinnerId: firstWinnerId,
          winners: winnersToReset,
        });
        setIsResetScoresDialogOpen(true);
      }
    }

    const resetWinValues = hasOtherUsersWithScores;
    const finalUsers: UserData[] = users.map(user => ({
      ...user,
      winValues: resetWinValues ? {} : { ...user.winValues },
    }));

    const baseLaCounts = winnerIds.some(id => id === currentWinnerId) ? { ...laCounts } : {};
    const newLaCounts: LaCounts = { ...baseLaCounts };

    const scoreChanges: ScoreChange[] = [];

    winnerIds.forEach(winnerId => {
      const winner = users.find(u => u.id === winnerId);
      const finalWinner = finalUsers.find(u => u.id === winnerId);
      if (!winner || !finalWinner) return;

      const baseValue = winnerValues[winnerId];
      if (!baseValue || baseValue <= 0) return;

      let currentScore = baseValue;
      const dealerBonusValue = 2 * consecutiveWins - 1;

      if (winnerId === dealerId) {
        currentScore += dealerBonusValue;
      } else if (loserUserId === dealerId) {
        currentScore += dealerBonusValue;
      }

      let finalValue = currentScore;

      const previousScore = winner.winValues[loserUserId] || 0;
      if (previousScore > 0) {
        const bonus = Math.round(previousScore * 0.5);
        finalValue = previousScore + bonus + currentScore;
      } else if (hasOtherUsersWithScores) {
        const previousScoreOnWinner = loser.winValues[winnerId] || 0;
        if (previousScoreOnWinner > 0) {
          finalValue = Math.floor(previousScoreOnWinner / 2) + currentScore;
        }
      }

      const originalWinner = users.find(u => u.id === winnerId);
      const previousValue = originalWinner?.winValues[loserUserId] || 0;
      finalWinner.winValues[loserUserId] = finalValue;

      scoreChanges.push({ userId: winnerId, change: finalValue - previousValue });

      newLaCounts[winnerId] = newLaCounts[winnerId] ? { ...newLaCounts[winnerId] } : {};
      newLaCounts[winnerId][loserUserId] = (newLaCounts[winnerId][loserUserId] || 0) + 1;
    });

    const totalLoserChange = scoreChanges.reduce((sum, change) => sum + change.change, 0);
    scoreChanges.push({ userId: loserUserId, change: -totalLoserChange });

    const { newDealerId, newConsecutiveWins } = handleWin(firstWinnerId, dealerId, consecutiveWins);

    const actionDescription = `一炮多響: ${loser.name} 被 ${winnerIds.map(id => users.find(u => u.id === id)?.name).join(', ')} 食胡`;

    setUsers(finalUsers);
    setLaCounts(newLaCounts);
    setCurrentWinnerId(firstWinnerId);
    setDealerId(newDealerId);
    setConsecutiveWins(newConsecutiveWins);

    const newHistory = saveStateToHistory(actionDescription, scoreChanges, currentStateForHistory);

    saveGameData({
      users: finalUsers,
      history: newHistory,
      dealerId: newDealerId,
      consecutiveWins: newConsecutiveWins,
      currentWinnerId: firstWinnerId,
      laCounts: newLaCounts,
    });

    setIsMultiHitDialogOpen(false);
  };

  const handleSaveUserNames = (updatedUsers: { id: number; name: string }[]) => {
    const newUsers = users.map((user) => {
      const updatedUser = updatedUsers.find((u) => u.id === user.id);
      return updatedUser ? { ...user, name: updatedUser.name } : user;
    });
    setUsers(newUsers);
    setIsRenameDialogOpen(false);
    saveGameData({ users: newUsers });
  };

  const handleSaveSeatChange = (newUsers: UserData[]) => {
    setUsers(newUsers);
    setIsSeatChangeDialogOpen(false);
    saveGameData({ users: newUsers });
  };

  const handleResetClick = () => {
    Alert.alert(
      '確認重置',
      '這將清除所有遊戲記錄、分數和歷史。此操作無法還原，確定要繼續嗎？',
      [
        { text: '取消', style: 'cancel' },
        { text: '確定重置', onPress: handleResetConfirm, style: 'destructive' },
      ]
    );
  };

  const handleResetConfirm = () => {
    const newUsers = users.map(user => ({ ...user, winValues: {} }));
    const newHistory: GameState[] = [];
    const newDealerId = users[0]?.id || 1;
    const newConsecutiveWins = 1;
    const newCurrentWinnerId = null;
    const newLaCounts = {};

    setUsers(newUsers);
    setLaCounts(newLaCounts);
    setCurrentWinnerId(newCurrentWinnerId);
    setHistory(newHistory);
    setDealerId(newDealerId);
    setConsecutiveWins(newConsecutiveWins);

    saveGameData({
      users: newUsers,
      history: newHistory,
      dealerId: newDealerId,
      consecutiveWins: newConsecutiveWins,
      currentWinnerId: newCurrentWinnerId,
      laCounts: newLaCounts,
    });
  };

  const handleRestore = () => {
    if (history.length > 0) {
      const lastState = history[history.length - 1];
      const newHistory = history.slice(0, -1);

      setUsers(lastState.users);
      setLaCounts(lastState.laCounts);
      setCurrentWinnerId(lastState.currentWinnerId);
      setDealerId(lastState.dealerId);
      setConsecutiveWins(lastState.consecutiveWins);
      setHistory(newHistory);

      saveGameData({
        users: lastState.users,
        history: newHistory,
        dealerId: lastState.dealerId,
        consecutiveWins: lastState.consecutiveWins,
        currentWinnerId: lastState.currentWinnerId,
        laCounts: lastState.laCounts,
      });
    }
  };

  const handleSurrender = (loserId: number) => {
    if (!currentWinnerId) return;

    const winner = users.find(u => u.id === currentWinnerId);
    const loser = users.find(u => u.id === loserId);

    if (!winner || !loser) return;

    const scoreToReset = winner.winValues[loserId] || 0;
    if (scoreToReset === 0) return;

    const currentStateForHistory: Omit<GameState, 'action' | 'scoreChanges'> = {
      users: JSON.parse(JSON.stringify(users)),
      laCounts: JSON.parse(JSON.stringify(laCounts)),
      currentWinnerId,
      dealerId,
      consecutiveWins,
    };

    const newLaCounts = { ...laCounts };
    if (newLaCounts[currentWinnerId]) {
      newLaCounts[currentWinnerId][loserId] = 0;
    }
    setLaCounts(newLaCounts);

    const newUsers = users.map(user => {
      if (user.id === currentWinnerId) {
        const newWinValues = { ...user.winValues };
        newWinValues[loserId] = 0;
        return { ...user, winValues: newWinValues };
      }
      return user;
    });
    setUsers(newUsers);

    const actionDescription = `${loser.name} 投降 to ${winner.name}`;
    const newHistory = saveStateToHistory(actionDescription, [], currentStateForHistory);

    saveGameData({
      users: newUsers,
      history: newHistory,
      laCounts: newLaCounts,
    });
  };

  const totalScores = useMemo(() => {
    const scores: { [key: number]: number } = {};
    users.forEach(u => scores[u.id] = 0);

    history.forEach(state => {
      state.scoreChanges.forEach(change => {
        if (scores[change.userId] !== undefined) {
          scores[change.userId] += change.change;
        }
      });
    });

    return scores;
  }, [history, users]);

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with tabs and menu */}
      <View style={styles.header}>
        <SegmentedButtons
          value={currentView}
          onValueChange={(value) => setCurrentView(value as 'game' | 'analytics')}
          buttons={[
            { value: 'game', label: 'Game Board' },
            { value: 'analytics', label: 'Analytics' },
          ]}
          style={styles.segmentedButtons}
        />

        <View style={styles.headerActions}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button mode="outlined" onPress={() => setMenuVisible(true)}>
                More
              </Button>
            }
          >
            <Menu.Item leadingIcon="pencil" onPress={() => { setMenuVisible(false); setIsRenameDialogOpen(true); }} title="改名" />
            <Menu.Item leadingIcon="shuffle" onPress={() => { setMenuVisible(false); setIsSeatChangeDialogOpen(true); }} title="換位" />
            <Divider />
            <Menu.Item leadingIcon="history" onPress={() => { setMenuVisible(false); handleRestore(); }} title="還原" disabled={history.length === 0} />
            <Menu.Item leadingIcon="refresh" onPress={() => { setMenuVisible(false); handleResetClick(); }} title="重置" />
            <Menu.Item leadingIcon="format-list-bulleted" onPress={() => { setMenuVisible(false); setIsHistoryDialogOpen(true); }} title="歷史記錄" disabled={history.length === 0} />
            <Menu.Item leadingIcon="currency-usd" onPress={() => { setMenuVisible(false); setIsPayoutDialogOpen(true); }} title="找數" disabled={history.length === 0} />
            <Divider />
            <Menu.Item leadingIcon="lightning-bolt" onPress={() => { setMenuVisible(false); handleOpenSpecialActionDialog(); }} title="特別賞罰" />
            <Divider />
            <Menu.Item
              title="籌碼模式"
              leadingIcon="lightning-bolt"
              trailingIcon={() => <Switch value={popOnNewWinner} onValueChange={setPopOnNewWinner} />}
              onPress={() => setPopOnNewWinner(p => !p)}
            />
          </Menu>
        </View>
      </View>

      {currentView === 'game' ? (
        <ScrollView style={styles.scrollView} horizontal>
          <View style={styles.tableContainer}>
            <DataTable>
              {/* Header Row 1 */}
              <DataTable.Header>
                <DataTable.Title style={styles.playerColumn}>玩家</DataTable.Title>
                <DataTable.Title style={styles.scoreHeaderCell}>番數</DataTable.Title>
              </DataTable.Header>

              {/* Header Row 2 - Opponent names */}
              <DataTable.Header>
                <DataTable.Title style={styles.playerColumn}> </DataTable.Title>
                {users.map(user => {
                  const laCount = currentWinnerId != null ? (laCounts[currentWinnerId]?.[user.id] || 0) : 0;
                  const canSurrender = laCount >= 3;
                  return (
                    <DataTable.Title key={user.id} style={styles.opponentColumn} numeric>
                      <View style={styles.opponentHeader}>
                        <Text style={styles.opponentName}>{user.name}</Text>
                        {laCount > 0 && (
                          <Text style={styles.laCount}>拉{laCount}</Text>
                        )}
                        {canSurrender && (
                          <Button
                            mode="contained"
                            buttonColor="#ef4444"
                            compact
                            onPress={() => handleSurrender(user.id)}
                            style={styles.surrenderButton}
                          >
                            投降
                          </Button>
                        )}
                      </View>
                    </DataTable.Title>
                  );
                })}
              </DataTable.Header>

              {/* Player Rows */}
              {users.map((user) => {
                const isDealer = user.id === dealerId;
                return (
                  <DataTable.Row
                    key={user.id}
                    style={[styles.playerRow, isDealer && styles.dealerRow]}
                  >
                    <DataTable.Cell style={styles.playerColumn}>
                      <View style={styles.playerInfo}>
                        <View style={styles.dealerControls}>
                          <TouchableOpacity
                            onPress={() => handleSetDealer(user.id)}
                            style={[styles.dealerButton, isDealer && styles.dealerButtonActive]}
                          >
                            <Text style={[styles.dealerButtonText, isDealer && styles.dealerButtonTextActive]}>
                              {isDealer && consecutiveWins > 1 ? `連${consecutiveWins - 1}` : ''}莊
                            </Text>
                          </TouchableOpacity>
                          {isDealer && (
                            <TouchableOpacity
                              onPress={handleManualConsecutiveWin}
                              style={styles.consecutiveButton}
                            >
                              <Text style={styles.consecutiveButtonText}>連莊</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.playerName}>{user.name}</Text>
                        <Button
                          mode="outlined"
                          compact
                          onPress={() => handleOpenWinActionDialog(user)}
                          style={styles.winButton}
                        >
                          食胡
                        </Button>
                        <Text style={styles.totalScore}>
                          Total: {totalScores[user.id]?.toLocaleString() ?? 0}
                        </Text>
                      </View>
                    </DataTable.Cell>
                    {users.map(opponent => (
                      <DataTable.Cell key={opponent.id} style={styles.opponentColumn} numeric>
                        <Text style={styles.scoreText}>
                          {(user.winValues[opponent.id] || 0).toLocaleString()}
                        </Text>
                      </DataTable.Cell>
                    ))}
                  </DataTable.Row>
                );
              })}
            </DataTable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.scrollView}>
          <Text style={styles.analyticsPlaceholder}>Analytics Dashboard (Coming Soon)</Text>
        </ScrollView>
      )}

      {/* Dialog Components */}
      <RenameDialog
        isOpen={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        users={users}
        onSave={handleSaveUserNames}
      />
      
      {currentUserForWinAction && (
        <WinActionDialog
          isOpen={isWinActionDialogOpen}
          onClose={() => {
            setIsWinActionDialogOpen(false);
            setCurrentUserForWinAction(null);
          }}
          mainUser={currentUserForWinAction}
          users={users}
          dealerId={dealerId}
          consecutiveWins={consecutiveWins}
          currentWinnerId={currentWinnerId}
          onSave={handleSaveWinAction}
          onLaunchMultiHit={handleLaunchMultiHitFromWinFlow}
        />
      )}

      {currentUserForSpecialAction && (
        <SpecialActionDialog
          isOpen={isSpecialActionDialogOpen}
          onClose={() => {
            setIsSpecialActionDialogOpen(false);
            setCurrentUserForSpecialAction(null);
          }}
          mainUser={currentUserForSpecialAction}
          users={users}
          onSave={handleExecuteSpecialAction}
          onSaveZhaHu={handleExecuteZhaHuAction}
        />
      )}

      <MultiHitDialog
        isOpen={isMultiHitDialogOpen}
        onClose={() => {
          setIsMultiHitDialogOpen(false);
          setMultiHitInitialLoserId(null);
        }}
        initialLoserId={multiHitInitialLoserId}
        users={users}
        dealerId={dealerId}
        consecutiveWins={consecutiveWins}
        onSave={handleExecuteMultiHitAction}
      />

      <HistoryDialog
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
        history={history}
        users={users}
      />

      <SeatChangeDialog
        isOpen={isSeatChangeDialogOpen}
        onClose={() => setIsSeatChangeDialogOpen(false)}
        users={users}
        onSave={handleSaveSeatChange}
      />

      <ResetScoresDialog
        isOpen={isResetScoresDialogOpen}
        onClose={() => setIsResetScoresDialogOpen(false)}
        scoresToReset={scoresToReset}
        users={users}
      />

      <PayoutDialog
        isOpen={isPayoutDialogOpen}
        onClose={() => setIsPayoutDialogOpen(false)}
        users={users}
        totalScores={totalScores}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  segmentedButtons: {
    marginBottom: 12,
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  tableContainer: {
    backgroundColor: '#fff',
    minWidth: '100%',
  },
  playerColumn: {
    minWidth: 140,
    justifyContent: 'flex-start',
  },
  scoreHeaderCell: {
    flex: 1,
    justifyContent: 'center',
  },
  opponentColumn: {
    minWidth: 100,
    justifyContent: 'center',
  },
  opponentHeader: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  opponentName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  laCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 4,
  },
  surrenderButton: {
    height: 24,
    marginTop: 4,
  },
  playerRow: {
    minHeight: 120,
  },
  dealerRow: {
    backgroundColor: '#fef3c7',
  },
  playerInfo: {
    paddingVertical: 8,
    gap: 8,
  },
  dealerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  dealerButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dealerButtonActive: {
    backgroundColor: '#fbbf24',
  },
  dealerButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  dealerButtonTextActive: {
    color: '#92400e',
  },
  consecutiveButton: {
    backgroundColor: '#93c5fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  consecutiveButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
  },
  winButton: {
    alignSelf: 'flex-start',
  },
  totalScore: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  analyticsPlaceholder: {
    padding: 24,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
});
