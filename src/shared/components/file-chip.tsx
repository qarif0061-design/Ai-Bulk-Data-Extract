import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FileStatus, FILE_STATUS_COLORS, FILE_STATUS_LABELS } from '../../core/enums/file-status';
import { Colors } from '../theme/colors';

interface FileChipProps {
  fileName: string;
  status: FileStatus;
  compact?: boolean;
}

export function FileChip({ fileName, status, compact = false }: FileChipProps) {
  const color = FILE_STATUS_COLORS[status];
  const label = FILE_STATUS_LABELS[status];

  const getStatusIcon = (): string => {
    switch (status) {
      case FileStatus.COMPLETED:
        return 'check-circle';
      case FileStatus.FAILED:
        return 'close-circle';
      case FileStatus.PROCESSING:
      case FileStatus.UPLOADING:
        return 'loading';
      default:
        return 'circle-outline';
    }
  };

  const truncatedName = compact && fileName.length > 20
    ? fileName.substring(0, 17) + '...'
    : fileName;

  return (
    <View style={[styles.chip, { borderColor: color + '40' }]}>
      <MaterialCommunityIcons name={getStatusIcon() as any} size={14} color={color} />
      <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
        {truncatedName}
      </Text>
      <View style={[styles.badge, { backgroundColor: color + '20' }]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: Colors.surface,
    marginRight: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 13,
    color: Colors.textPrimary,
    marginLeft: 6,
    maxWidth: 120,
  },
  nameCompact: {
    fontSize: 12,
    maxWidth: 80,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
