/* eslint-disable max-lines */
/*
    This file is auto-generated for locale typings.
    Generated on 09/02/2024.
*/

export interface RawonLang {
    "events.createMessage": {
        "author": string;
        "prefix": string;
    };
    "events.cmdLoading": string;
    "reusable.invalidUsage": {
        "prefix": string;
        "name": string;
    };
    "reusable.pageFooter": {
        "actual": string;
        "total": string;
    };
    "utils.cooldownMessage": {
        "author": string;
        "timeleft": string;
    };
    "commands.developers.categoryName": string;
    "commands.general.categoryName": string;
    "commands.moderation.categoryName": string;
    "commands.music.categoryName": string;
    "events.channelUpdate.connectionReconfigured": string;
    "events.channelUpdate.reconfigureConnection": string;
    "events.channelUpdate.unableReconfigureConnection": string;
    "events.createInteraction.message1": {
        "user": string;
    };
    "events.createInteraction.message2": {
        "user": string;
    };
    "events.voiceStateUpdate.connectionReconfigured": string;
    "events.voiceStateUpdate.deleteQueue": {
        "duration": string;
    };
    "events.voiceStateUpdate.deleteQueueFooter": string;
    "events.voiceStateUpdate.disconnectFromVCMessage": string;
    "events.voiceStateUpdate.joinStageMessage": string;
    "events.voiceStateUpdate.joiningAsSpeaker": string;
    "events.voiceStateUpdate.pauseQueue": {
        "duration": string;
    };
    "events.voiceStateUpdate.pauseQueueFooter": string;
    "events.voiceStateUpdate.reconfigureConnection": string;
    "events.voiceStateUpdate.resumeQueue": {
        "song": string;
    };
    "events.voiceStateUpdate.resumeQueueFooter": string;
    "events.voiceStateUpdate.unableJoinStageMessage": string;
    "events.voiceStateUpdate.unableReconfigureConnection": string;
    "utils.generalHandler.errorJoining": {
        "message": string;
    };
    "utils.generalHandler.errorPlaying": {
        "message": string;
    };
    "utils.generalHandler.handleVideoInitial": {
        "length": string;
    };
    "utils.generalHandler.leftVC": string;
    "utils.generalHandler.queueEnded": {
        "usage": string;
    };
    "utils.generalHandler.startPlaying": {
        "song": string;
    };
    "utils.generalHandler.stopPlaying": {
        "song": string;
    };
    "utils.musicDecorator.noInVC": string;
    "utils.musicDecorator.noQueue": string;
    "utils.musicDecorator.sameVC": string;
    "utils.musicDecorator.validVCJoinable": string;
    "utils.musicDecorator.validVCPermission": string;
    "commands.developers.eval.description": string;
    "commands.developers.eval.errorString": string;
    "commands.developers.eval.noCode": string;
    "commands.developers.eval.inputString": string;
    "commands.developers.eval.outputString": string;
    "commands.developers.eval.usage": {
        "prefix": string;
    };
    "commands.general.about.aboutFooter": {
        "botname": string;
    };
    "commands.general.about.botUptimeString": string;
    "commands.general.about.botVersionString": string;
    "commands.general.about.cachedUsersString": string;
    "commands.general.about.channelsString": string;
    "commands.general.about.commitString": string;
    "commands.general.about.description": string;
    "commands.general.about.discordJSVersionString": string;
    "commands.general.about.ffmpegVersionString": string;
    "commands.general.about.nodeVersionString": string;
    "commands.general.about.osUptimeString": string;
    "commands.general.about.processUptimeString": string;
    "commands.general.about.serversString": string;
    "commands.general.about.sourceCodeString": string;
    "commands.general.help.aliasesString": string;
    "commands.general.help.authorString": {
        "username": string;
    };
    "commands.general.help.commandDetailTitle": {
        "username": string;
        "command": string;
    };
    "commands.general.help.commandSelectionString": string;
    "commands.general.help.commandUsageFooter": {
        "devOnly": string;
    };
    "commands.general.help.description": string;
    "commands.general.help.descriptionString": string;
    "commands.general.help.footerString": {
        "prefix": string;
    };
    "commands.general.help.nameString": string;
    "commands.general.help.noCommanSuggest": string;
    "commands.general.help.noCommand": string;
    "commands.general.help.slashDescription": string;
    "commands.general.help.usage": {
        "prefix": string;
    };
    "commands.general.help.usageString": string;
    "commands.general.invite.clickURL": {
        "url": string;
    };
    "commands.general.invite.description": string;
    "commands.general.invite.inviteTitle": {
        "bot": string;
    };
    "commands.general.ping.description": string;
    "commands.general.ping.footerString": {
        "user": string;
    };
    "commands.moderation.ban.banFail": {
        "message": string;
    };
    "commands.moderation.ban.banSuccess": {
        "user": string;
    };
    "commands.moderation.ban.bannedByString": {
        "author": string;
    };
    "commands.moderation.ban.botNoPermission": string;
    "commands.moderation.ban.description": string;
    "commands.moderation.ban.slashMemberIDDescription": string;
    "commands.moderation.ban.slashReasonDescription": string;
    "commands.moderation.ban.usage": {
        "prefix": string;
    };
    "commands.moderation.ban.userBanned": {
        "guildName": string;
    };
    "commands.moderation.ban.userNoBannable": string;
    "commands.moderation.ban.userNoPermission": string;
    "commands.moderation.common.noReasonString": string;
    "commands.moderation.common.noUserSpecified": string;
    "commands.moderation.common.reasonString": string;
    "commands.moderation.infractions.description": string;
    "commands.moderation.infractions.embedAuthorText": {
        "user": string;
    };
    "commands.moderation.infractions.noInfractions": string;
    "commands.moderation.infractions.slashMemberDescription": string;
    "commands.moderation.infractions.usage": {
        "prefix": string;
    };
    "commands.moderation.kick.botNoPermission": string;
    "commands.moderation.kick.description": string;
    "commands.moderation.kick.kickFail": {
        "message": string;
    };
    "commands.moderation.kick.kickSuccess": {
        "user": string;
    };
    "commands.moderation.kick.kickedByString": {
        "author": string;
    };
    "commands.moderation.kick.slashMemberDescription": string;
    "commands.moderation.kick.slashReasonDescription": string;
    "commands.moderation.kick.usage": {
        "prefix": string;
    };
    "commands.moderation.kick.userKicked": {
        "guildName": string;
    };
    "commands.moderation.kick.userNoKickable": string;
    "commands.moderation.kick.userNoPermission": string;
    "commands.moderation.modlogs.description": string;
    "commands.moderation.modlogs.disable": string;
    "commands.moderation.modlogs.embedTitle": string;
    "commands.moderation.modlogs.enable": string;
    "commands.moderation.modlogs.newChannelText": string;
    "commands.moderation.modlogs.slashChannelDescription": string;
    "commands.moderation.modlogs.slashChannelNewChannelOption": string;
    "commands.moderation.modlogs.slashDisableDescription": string;
    "commands.moderation.modlogs.slashEnableDescription": string;
    "commands.moderation.modlogs.usage": {
        "prefix": string;
    };
    "commands.moderation.mute.alreadyMuted": string;
    "commands.moderation.mute.botNoPermission": string;
    "commands.moderation.mute.cantMuteOwner": string;
    "commands.moderation.mute.description": string;
    "commands.moderation.mute.muteFail": {
        "message": string;
    };
    "commands.moderation.mute.muteSuccess": {
        "user": string;
    };
    "commands.moderation.mute.mutedByString": {
        "author": string;
    };
    "commands.moderation.mute.noRole": {
        "prefix": string;
    };
    "commands.moderation.mute.slashMemberDescription": string;
    "commands.moderation.mute.slashReasonDescription": string;
    "commands.moderation.mute.usage": {
        "prefix": string;
    };
    "commands.moderation.mute.userMuted": {
        "guildName": string;
    };
    "commands.moderation.mute.userNoPermission": string;
    "commands.moderation.purge.botNoPermission": string;
    "commands.moderation.purge.description": string;
    "commands.moderation.purge.invalidAmount": string;
    "commands.moderation.purge.purgeFail": {
        "message": string;
    };
    "commands.moderation.purge.purgeSuccess": {
        "amount": number;
    };
    "commands.moderation.purge.slashAmountDescription": string;
    "commands.moderation.purge.usage": {
        "prefix": string;
    };
    "commands.moderation.purge.userNoPermission": string;
    "commands.moderation.setmute.description": string;
    "commands.moderation.setmute.invalidRole": string;
    "commands.moderation.setmute.slashRoleDescription": string;
    "commands.moderation.setmute.success": {
        "role": string;
    };
    "commands.moderation.setmute.usage": {
        "prefix": string;
    };
    "commands.moderation.unban.alreadyUnban": string;
    "commands.moderation.unban.description": string;
    "commands.moderation.unban.slashMemberDescription": string;
    "commands.moderation.unban.slashReasonDescription": string;
    "commands.moderation.unban.unbanSuccess": {
        "user": string;
    };
    "commands.moderation.unban.unbanFail": {
        "message": string;
    };
    "commands.moderation.unban.unbannedByString": {
        "author": string;
    };
    "commands.moderation.unban.usage": {
        "prefix": string;
    };
    "commands.moderation.unmute.description": string;
    "commands.moderation.unmute.noMuted": string;
    "commands.moderation.unmute.slashMemberDescription": string;
    "commands.moderation.unmute.slashReasonDescription": string;
    "commands.moderation.unmute.unmuteFail": {
        "message": string;
    };
    "commands.moderation.unmute.unmuteSuccess": {
        "user": string;
    };
    "commands.moderation.unmute.unmutedByString": {
        "author": string;
    };
    "commands.moderation.unmute.usage": {
        "prefix": string;
    };
    "commands.moderation.unmute.userUnmuted": {
        "guildName": string;
    };
    "commands.moderation.warn.description": string;
    "commands.moderation.warn.noDM": string;
    "commands.moderation.warn.slashMemberDescription": string;
    "commands.moderation.warn.slashReasonDescription": string;
    "commands.moderation.warn.usage": {
        "prefix": string;
    };
    "commands.moderation.warn.userNoPermission": string;
    "commands.moderation.warn.userWarned": {
        "guildName": string;
    };
    "commands.moderation.warn.warnSuccess": {
        "user": string;
    };
    "commands.moderation.warn.warnedByString": {
        "author": string;
    };
    "commands.music.dj.description": string;
    "commands.music.dj.disable": string;
    "commands.music.dj.disableText": string;
    "commands.music.dj.embedTitle": string;
    "commands.music.dj.enable": string;
    "commands.music.dj.enableText": string;
    "commands.music.dj.newRoleText": string;
    "commands.music.dj.slashDisableDescription": string;
    "commands.music.dj.slashEnableDescription": string;
    "commands.music.dj.slashRoleDescription": string;
    "commands.music.dj.slashRoleNewRoleOption": string;
    "commands.music.filter.availableFilters": string;
    "commands.music.filter.currentlyUsedFilters": string;
    "commands.music.filter.currentState": {
        "filter": string;
        "state": string;
    };
    "commands.music.filter.description": string;
    "commands.music.filter.embedFooter": {
        "opstate": string;
        "prefix": string;
        "opstate": string;
        "filter": string;
    };
    "commands.music.filter.filterSet": {
        "filter": string;
        "state": string;
    };
    "commands.music.filter.slashStateDescription": {
        "state": string;
    };
    "commands.music.filter.slashStateFilterDescription": {
        "state": string;
    };
    "commands.music.filter.slashStatusDescription": string;
    "commands.music.filter.slashStatusFilterDescription": string;
    "commands.music.filter.specifyFilter": string;
    "commands.music.lyrics.apiError": {
        "song": string;
        "message": string;
    };
    "commands.music.lyrics.description": string;
    "commands.music.lyrics.noQuery": string;
    "commands.music.lyrics.slashDescription": string;
    "commands.music.lyrics.usage": {
        "prefix": string;
    };
    "commands.music.nowplaying.description": string;
    "commands.music.nowplaying.disableButton": string;
    "commands.music.nowplaying.emptyQueue": string;
    "commands.music.pause.alreadyPause": string;
    "commands.music.pause.description": string;
    "commands.music.pause.pauseMessage": string;
    "commands.music.play.alreadyPlaying": {
        "voiceChannel": string;
    };
    "commands.music.play.description": string;
    "commands.music.play.noSongData": string;
    "commands.music.play.slashQueryDescription": string;
    "commands.music.play.usage": {
        "prefix": string;
    };
    "commands.music.queue.description": string;
    "commands.music.remove.description": string;
    "commands.music.remove.noPermission": string;
    "commands.music.remove.noPositions": string;
    "commands.music.remove.slashPositionsDescription": string;
    "commands.music.remove.songSkip": string;
    "commands.music.remove.songsRemoved": {
        "removed": number;
    };
    "commands.music.remove.usage": {
        "prefix": string;
    };
    "commands.music.repeat.actualMode": {
        "mode": string;
    };
    "commands.music.repeat.description": string;
    "commands.music.repeat.footer": {
        "prefix": string;
    };
    "commands.music.repeat.newMode": {
        "mode": string;
    };
    "commands.music.repeat.slashDisable": string;
    "commands.music.repeat.slashQueue": string;
    "commands.music.repeat.slashSong": string;
    "commands.music.repeat.usage": {
        "options": string;
    };
    "commands.music.resume.alreadyResume": string;
    "commands.music.resume.description": string;
    "commands.music.resume.resumeMessage": string;
    "commands.music.search.cancelMessage": {
        "cancel": string;
    };
    "commands.music.search.canceledMessage": string;
    "commands.music.search.description": string;
    "commands.music.search.interactionContent": string;
    "commands.music.search.interactionPlaceholder": string;
    "commands.music.search.noQuery": string;
    "commands.music.search.noSelection": string;
    "commands.music.search.noTracks": string;
    "commands.music.search.queueEmbed": {
        "separator": string;
    };
    "commands.music.search.slashDescription": string;
    "commands.music.search.slashQueryDescription": string;
    "commands.music.search.slashSourceDescription": string;
    "commands.music.search.trackSelectionMessage": string;
    "commands.music.search.usage": {
        "prefix": string;
    };
    "commands.music.shuffle.actualState": {
        "state": string;
    };
    "commands.music.shuffle.description": string;
    "commands.music.shuffle.newState": {
        "state": string;
    };
    "commands.music.skip.description": string;
    "commands.music.skip.skipMessage": {
        "song": string;
    };
    "commands.music.skip.voteResultMessage": {
        "length": string;
        "required": string;
    };
    "commands.music.skipTo.cantPlay": string;
    "commands.music.skipTo.description": string;
    "commands.music.skipTo.noPermission": string;
    "commands.music.skipTo.noSongPosition": string;
    "commands.music.skipTo.skipMessage": {
        "song": string;
    };
    "commands.music.skipTo.slashFirstDescription": string;
    "commands.music.skipTo.slashLastDescription": string;
    "commands.music.skipTo.slashPositionDescription": string;
    "commands.music.skipTo.slashSpecificDescription": string;
    "commands.music.skipTo.usage": {
        "options": string;
    };
    "commands.music.stayInQueue.247Disabled": string;
    "commands.music.stayInQueue.actualState": {
        "state": string;
    };
    "commands.music.stayInQueue.description": string;
    "commands.music.stayInQueue.newState": {
        "state": string;
    };
    "commands.music.stayInQueue.slashDescription": string;
    "commands.music.stop.description": string;
    "commands.music.stop.stoppedMessage": string;
    "commands.music.volume.changeVolume": string;
    "commands.music.volume.currentVolume": {
        "volume": string;
    };
    "commands.music.volume.description": string;
    "commands.music.volume.newVolume": {
        "volume": string;
    };
    "commands.music.volume.plsPause": {
        "volume": string;
    };
    "commands.music.volume.slashDescription": string;
    "commands.music.volume.usage": {
        "prefix": string;
    };
    "commands.music.volume.volumeLimit": {
        "maxVol": string;
    };
    "commands.moderation.modlogs.channel.current": {
        "channel": string;
    };
    "commands.moderation.modlogs.channel.invalid": string;
    "commands.moderation.modlogs.channel.noChannel": string;
    "commands.moderation.modlogs.channel.success": {
        "channel": string;
    };
    "commands.music.dj.role.current": {
        "role": string;
    };
    "commands.music.dj.role.invalid": string;
    "commands.music.dj.role.noRole": {
        "prefix": string;
    };
    "commands.music.dj.role.success": {
        "role": string;
    };
}
