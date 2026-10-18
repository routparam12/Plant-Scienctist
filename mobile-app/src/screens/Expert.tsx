import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  Star,
  ShieldCheck,
  X,
  CreditCard,
  MessageSquare,
  Paperclip,
  CheckCircle,
  PhoneOff,
} from 'lucide-react-native';
import { Agronomist, AppLanguage, ConsultationBooking } from '../types';
import { AGRONOMISTS_MARKETPLACE, INITIAL_BOOKINGS } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { THEME } from '../constants/theme';

interface ExpertScreenProps {
  language?: AppLanguage;
  preselectedDisease?: string | null;
}

export type AppointmentScreenProps = ExpertScreenProps;

export const ExpertScreen: React.FC<ExpertScreenProps> = ({
  language = 'hi',
  preselectedDisease,
}) => {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-bookings'>('marketplace');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [bookingAgronomist, setBookingAgronomist] = useState<Agronomist | null>(null);
  const [bookings, setBookings] = useState<ConsultationBooking[]>(INITIAL_BOOKINGS);

  // Booking Form State
  const [selectedDate, setSelectedDate] = useState<string>('Tomorrow, Oct 16');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('11:00 AM - 11:30 AM');
  const [selectedConsultationType, setSelectedConsultationType] = useState<
    'Video Call' | 'Voice Call' | 'In-Field Visit'
  >('Video Call');
  const [selectedCropCase, setSelectedCropCase] = useState<string>(
    'Tomato (Abhinav) • Leaf Curl Scan + Soil Test Attached'
  );
  const [farmerNotes, setFarmerNotes] = useState<string>(
    preselectedDisease ? `Need urgent consultation regarding: ${preselectedDisease}` : ''
  );
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [activeVideoCallBooking, setActiveVideoCallBooking] = useState<ConsultationBooking | null>(
    null
  );

  const specialties = ['All', 'Pest & Disease', 'Soil Science', 'Horticulture', 'Organic Farming'];

  const filteredAgronomists =
    selectedSpecialty === 'All'
      ? AGRONOMISTS_MARKETPLACE
      : AGRONOMISTS_MARKETPLACE.filter((a) =>
          a.specialties.includes(selectedSpecialty)
        );

  const handleConfirmBooking = () => {
    if (!bookingAgronomist) return;

    const caseDetails = preselectedDisease
      ? `Case Attachment: ${preselectedDisease} scan report attached. ${farmerNotes}`
      : `Case Attachment: ${selectedCropCase}. ${farmerNotes}`;

    const newBooking: ConsultationBooking = {
      id: `book-${Date.now().toString().slice(-4)}`,
      agronomistId: bookingAgronomist.id,
      agronomistName: bookingAgronomist.name,
      agronomistTitle: bookingAgronomist.title,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      type: selectedConsultationType,
      crop: selectedCropCase.split(' • ')[0] || 'Tomato (Abhinav)',
      fee: bookingAgronomist.fee,
      status: 'Confirmed',
      createdAt: new Date().toISOString().split('T')[0],
      notes: caseDetails,
    };

    setBookings((prev) => [newBooking, ...prev]);
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setBookingAgronomist(null);
      setActiveTab('my-bookings');
    }, 1200);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Header with Eyebrow and 48px Circular Action */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.textMuted }]}>
              AGRONOMIST // VERIFIED ICAR NETWORK
            </Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Field Experts.</Text>
          </View>

          <Pressable
            style={[styles.headerActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setActiveTab(activeTab === 'marketplace' ? 'my-bookings' : 'marketplace')}
          >
            <Calendar size={20} color={colors.primary} />
            {bookings.length > 0 && (
              <View style={[styles.badgeCount, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeCountText}>{bookings.length}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* 2. View Switcher Pill */}
        <View style={[styles.switcherPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            style={[
              styles.switcherBtn,
              activeTab === 'marketplace' && [styles.switcherBtnActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setActiveTab('marketplace')}
          >
            <Text
              style={[
                styles.switcherBtnText,
                { color: colors.textSecondary },
                activeTab === 'marketplace' && { color: colors.onPrimary || '#FFFFFF' },
              ]}
            >
              Find Expert
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.switcherBtn,
              activeTab === 'my-bookings' && [styles.switcherBtnActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setActiveTab('my-bookings')}
          >
            <Text
              style={[
                styles.switcherBtnText,
                { color: colors.textSecondary },
                activeTab === 'my-bookings' && { color: colors.onPrimary || '#FFFFFF' },
              ]}
            >
              My Bookings
            </Text>
            {bookings.length > 0 && (
              <View
                style={[
                  styles.switcherCountBadge,
                  { backgroundColor: colors.primary },
                  activeTab === 'my-bookings' && { backgroundColor: '#FFFFFF' },
                ]}
              >
                <Text
                  style={[
                    styles.switcherCountText,
                    { color: '#FFFFFF' },
                    activeTab === 'my-bookings' && { color: colors.primary },
                  ]}
                >
                  {bookings.length}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {activeTab === 'marketplace' ? (
          <>
            {/* Specialty Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.specialtyCarousel}
            >
              {specialties.map((spec) => {
                const isSelected = selectedSpecialty === spec;
                return (
                  <Pressable
                    key={spec}
                    style={[
                      styles.specChip,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedSpecialty(spec)}
                  >
                    <Text
                      style={[
                        styles.specChipText,
                        { color: colors.textSecondary },
                        isSelected && { color: colors.onPrimary || '#FFFFFF', fontWeight: '700' },
                      ]}
                    >
                      {spec}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Expert Cards */}
            <View style={styles.expertsList}>
              {filteredAgronomists.map((agronomist) => (
                <View
                  key={agronomist.id}
                  style={[
                    styles.expertCard,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                  ]}
                >
                  {/* Top Row: Avatar + Details + Rating/Fee */}
                  <View style={styles.expertTopRow}>
                    <View style={styles.expertLeft}>
                      <View
                        style={[
                          styles.avatarCircle,
                          { backgroundColor: agronomist.avatarBg || colors.primary },
                        ]}
                      >
                        <Text style={styles.avatarInitials}>{agronomist.avatarInitials}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.nameRow}>
                          <Text style={[styles.expertName, { color: colors.textPrimary }]}>
                            {agronomist.name}
                          </Text>
                          <View style={[styles.icarBadge, { backgroundColor: colors.accentBg }]}>
                            <ShieldCheck size={11} color={colors.primary} />
                            <Text style={[styles.icarBadgeText, { color: colors.primary }]}>ICAR</Text>
                          </View>
                        </View>

                        <Text style={[styles.expertTitle, { color: colors.textSecondary }]}>
                          {agronomist.title}
                        </Text>
                        <Text style={[styles.expertMeta, { color: colors.textMuted }]}>
                          {agronomist.institution} • {agronomist.experienceYears} YRS EXP
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ratingFeeCol}>
                      <View style={styles.ratingRow}>
                        <Star size={12} color="#D97706" fill="#D97706" />
                        <Text style={styles.ratingNum}>{agronomist.rating}</Text>
                        <Text style={[styles.reviewCount, { color: colors.textMuted }]}>
                          ({agronomist.reviewCount})
                        </Text>
                      </View>
                      <Text style={[styles.feeAmount, { color: colors.primary }]}>
                        ₹{agronomist.fee}
                      </Text>
                      <Text style={[styles.feeSub, { color: colors.textMuted }]}>PER SESSION</Text>
                    </View>
                  </View>

                  {/* Bio quote */}
                  {agronomist.bio && (
                    <View style={[styles.bioBox, { backgroundColor: colors.pillBg }]}>
                      <Text style={[styles.bioText, { color: colors.textSecondary }]}>
                        "{agronomist.bio}"
                      </Text>
                    </View>
                  )}

                  {/* Languages & Next Slot */}
                  <View style={styles.metaRow}>
                    <View style={styles.languagesList}>
                      <Text style={[styles.langLabel, { color: colors.textMuted }]}>LANGUAGES:</Text>
                      {(agronomist.languages || ['Hindi', 'English']).map((lang) => (
                        <View key={lang} style={[styles.langPill, { backgroundColor: colors.accentBg }]}>
                          <Text style={[styles.langPillText, { color: colors.primary }]}>{lang}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.slotRow}>
                      <Clock size={12} color={colors.primary} />
                      <Text style={[styles.slotText, { color: colors.primary }]}>
                        {agronomist.nextSlot}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
                    <Pressable
                      style={[styles.bookCallBtn, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        setBookingAgronomist(agronomist);
                        setSelectedConsultationType('Video Call');
                      }}
                    >
                      <Video size={14} color="#FFFFFF" />
                      <Text style={styles.bookCallBtnText}>
                        Book Video Call (₹{agronomist.fee})
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.voiceCallBtn,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                      onPress={() => {
                        setBookingAgronomist(agronomist);
                        setSelectedConsultationType('Voice Call');
                      }}
                    >
                      <Phone size={14} color={colors.textPrimary} />
                      <Text style={[styles.voiceCallBtnText, { color: colors.textPrimary }]}>Voice</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          /* My Bookings View */
          <View style={styles.bookingsList}>
            {bookings.length === 0 ? (
              <View style={[styles.emptyBookingsBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                <Calendar size={36} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  No active consultation bookings
                </Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Book a video consultation with verified ICAR agronomists anytime.
                </Text>
                <Pressable
                  style={[styles.browseExpertsBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setActiveTab('marketplace')}
                >
                  <Text style={styles.browseExpertsText}>Browse Experts</Text>
                </Pressable>
              </View>
            ) : (
              bookings.map((booking) => (
                <View
                  key={booking.id}
                  style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  <View style={styles.bookingCardHeader}>
                    <View>
                      <View style={[styles.statusPill, { backgroundColor: colors.accentBg }]}>
                        <Text style={[styles.statusPillText, { color: colors.primary }]}>
                          {booking.status}
                        </Text>
                      </View>
                      <Text style={[styles.bookingAgroName, { color: colors.textPrimary }]}>
                        {booking.agronomistName}
                      </Text>
                      <Text style={[styles.bookingAgroTitle, { color: colors.textMuted }]}>
                        {booking.agronomistTitle}
                      </Text>
                    </View>

                    <Text style={[styles.paidBadge, { color: colors.primary }]}>
                      ₹{booking.fee} PAID
                    </Text>
                  </View>

                  <View style={[styles.bookingDetailsBox, { backgroundColor: colors.pillBg }]}>
                    <View style={styles.detailItem}>
                      <Calendar size={13} color={colors.primary} />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        {booking.date}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Clock size={13} color={colors.primary} />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        {booking.timeSlot}
                      </Text>
                    </View>
                    <View style={[styles.detailItem, { width: '100%', marginTop: 4 }]}>
                      <Video size={13} color={colors.primary} />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        Mode: {booking.type} • Plot: {booking.crop}
                      </Text>
                    </View>
                  </View>

                  {/* Auto-Attached Case History Display */}
                  {booking.notes && (
                    <View style={[styles.caseAttachmentBox, { backgroundColor: colors.accentBg, borderColor: colors.border }]}>
                      <View style={styles.caseAttachmentHeader}>
                        <Paperclip size={12} color={colors.primary} />
                        <Text style={[styles.caseAttachmentTitle, { color: colors.primary }]}>
                          AUTO-ATTACHED CASE HISTORY & SCAN REPORT
                        </Text>
                      </View>
                      <Text style={[styles.caseAttachmentContent, { color: colors.textSecondary }]}>
                        "{booking.notes}"
                      </Text>
                    </View>
                  )}

                  {/* Join Consultation Room Button */}
                  <Pressable
                    style={[styles.joinRoomBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setActiveVideoCallBooking(booking)}
                  >
                    <Video size={16} color="#FFFFFF" />
                    <Text style={styles.joinRoomBtnText}>
                      Join Consultation Room (Live Demo)
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* 3. Interactive Booking Bottom Sheet Modal */}
      {bookingAgronomist && (
        <Modal
          visible={!!bookingAgronomist}
          transparent
          animationType="slide"
          onRequestClose={() => setBookingAgronomist(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.bookingModalContent, { backgroundColor: colors.card }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderInfo}>
                  <View
                    style={[
                      styles.avatarCircleSmall,
                      { backgroundColor: bookingAgronomist.avatarBg || colors.primary },
                    ]}
                  >
                    <Text style={styles.avatarInitialsSmall}>
                      {bookingAgronomist.avatarInitials}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                      Book {bookingAgronomist.name}
                    </Text>
                    <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                      Fee: ₹{bookingAgronomist.fee} • {bookingAgronomist.institution}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={[styles.modalCloseBtn, { backgroundColor: colors.pillBg }]}
                  onPress={() => setBookingAgronomist(null)}
                >
                  <X size={18} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* Scrollable Form Content */}
              <ScrollView style={styles.bookingFormScroll} showsVerticalScrollIndicator={false}>
                {/* Auto-Attached Case History Banner */}
                <View style={[styles.autoAttachBanner, { backgroundColor: colors.accentBg }]}>
                  <View style={styles.autoAttachHeader}>
                    <View style={styles.autoAttachLeft}>
                      <Paperclip size={13} color={colors.primary} />
                      <Text style={[styles.autoAttachTitle, { color: colors.primary }]}>
                        AUTO-ATTACHING CROP CASE HISTORY
                      </Text>
                    </View>
                    <Text style={[styles.attachedPill, { color: colors.primary }]}>ATTACHED</Text>
                  </View>

                  <View style={[styles.caseSelectContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.caseSelectText, { color: colors.textPrimary }]}>
                      🌿 {selectedCropCase}
                    </Text>
                  </View>
                </View>

                {/* Consultation Mode */}
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, { color: colors.textMuted }]}>CONSULTATION MODE</Text>
                  <View style={styles.modeButtonsRow}>
                    {(['Video Call', 'Voice Call', 'In-Field Visit'] as const).map((type) => {
                      const isSelected = selectedConsultationType === type;
                      return (
                        <Pressable
                          key={type}
                          style={[
                            styles.modeBtn,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                          onPress={() => setSelectedConsultationType(type)}
                        >
                          {type === 'Video Call' ? (
                            <Video size={16} color={isSelected ? '#FFFFFF' : colors.textSecondary} />
                          ) : type === 'Voice Call' ? (
                            <Phone size={16} color={isSelected ? '#FFFFFF' : colors.textSecondary} />
                          ) : (
                            <MapPin size={16} color={isSelected ? '#FFFFFF' : colors.textSecondary} />
                          )}
                          <Text
                            style={[
                              styles.modeBtnText,
                              { color: colors.textSecondary },
                              isSelected && { color: colors.onPrimary || '#FFFFFF', fontWeight: '700' },
                            ]}
                          >
                            {type}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Date Selection */}
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, { color: colors.textMuted }]}>SELECT DATE</Text>
                  <View style={styles.dateButtonsRow}>
                    {['Today, Oct 15', 'Tomorrow, Oct 16', 'Friday, Oct 17'].map((d) => {
                      const isSelected = selectedDate === d;
                      return (
                        <Pressable
                          key={d}
                          style={[
                            styles.dateBtn,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            isSelected && { backgroundColor: colors.accentBg, borderColor: colors.primary },
                          ]}
                          onPress={() => setSelectedDate(d)}
                        >
                          <Text
                            style={[
                              styles.dateBtnText,
                              { color: colors.textSecondary },
                              isSelected && { color: colors.primary, fontWeight: '800' },
                            ]}
                          >
                            {d}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Available Slots */}
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, { color: colors.textMuted }]}>AVAILABLE SLOTS</Text>
                  <View style={styles.slotsGrid}>
                    {[
                      '10:00 AM - 10:30 AM',
                      '11:00 AM - 11:30 AM',
                      '04:30 PM - 05:00 PM',
                      '06:00 PM - 06:30 PM',
                    ].map((slot) => {
                      const isSelected = selectedTimeSlot === slot;
                      return (
                        <Pressable
                          key={slot}
                          style={[
                            styles.slotBtn,
                            { backgroundColor: colors.card, borderColor: colors.border },
                            isSelected && { backgroundColor: colors.accentBg, borderColor: colors.primary },
                          ]}
                          onPress={() => setSelectedTimeSlot(slot)}
                        >
                          <Text
                            style={[
                              styles.slotBtnText,
                              { color: colors.textSecondary },
                              isSelected && { color: colors.primary, fontWeight: '800' },
                            ]}
                          >
                            {slot}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Farmer Notes */}
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, { color: colors.textMuted }]}>ADDITIONAL FARMER NOTES</Text>
                  <TextInput
                    style={[
                      styles.notesInput,
                      { backgroundColor: colors.inputBg, color: colors.textPrimary, borderColor: colors.border },
                    ]}
                    placeholder="e.g., Leaf curl symptoms in Block 3, need recommendation on spray..."
                    placeholderTextColor={colors.textMuted}
                    value={farmerNotes}
                    onChangeText={setFarmerNotes}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* Summary Fee */}
                <View style={[styles.feeSummaryBox, { backgroundColor: colors.pillBg, borderColor: colors.border }]}>
                  <View>
                    <Text style={[styles.feeSummaryLabel, { color: colors.textMuted }]}>TOTAL CONSULTATION FEE</Text>
                    <Text style={[styles.feeSummaryTitle, { color: colors.textPrimary }]}>
                      Includes digital Rx & follow-up chat
                    </Text>
                  </View>
                  <Text style={[styles.feeSummaryAmount, { color: colors.primary }]}>₹{bookingAgronomist.fee}</Text>
                </View>
              </ScrollView>

              {/* Confirm Button */}
              <View style={styles.modalFooter}>
                <Pressable
                  style={[
                    styles.confirmBtn,
                    { backgroundColor: colors.primary },
                    bookingSuccess && styles.confirmBtnSuccess,
                  ]}
                  onPress={handleConfirmBooking}
                  disabled={bookingSuccess}
                >
                  {bookingSuccess ? (
                    <>
                      <CheckCircle size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.confirmBtnText}>
                        Case Attached & Booked! Transferring...
                      </Text>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.confirmBtnText}>
                        Confirm & Book Call (₹{bookingAgronomist.fee})
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* 4. Simulated Live Video Consultation Room Modal */}
      {activeVideoCallBooking && (
        <Modal
          visible={!!activeVideoCallBooking}
          transparent={false}
          animationType="fade"
          onRequestClose={() => setActiveVideoCallBooking(null)}
        >
          <View style={styles.videoRoomContainer}>
            {/* Top Video Header */}
            <SafeAreaView style={styles.videoHeaderSafe}>
              <View style={styles.videoHeader}>
                <View style={styles.videoDoctorMeta}>
                  <View style={styles.livePulseDot} />
                  <View>
                    <Text style={styles.videoDoctorName}>
                      {activeVideoCallBooking.agronomistName}
                    </Text>
                    <Text style={styles.videoDoctorSub}>
                      LIVE ICAR TELE-AGRONOMY • ENCRYPTED
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.endCallHeaderBtn}
                  onPress={() => setActiveVideoCallBooking(null)}
                >
                  <Text style={styles.endCallHeaderText}>End Call</Text>
                </Pressable>
              </View>
            </SafeAreaView>

            {/* Video Main Feed */}
            <View style={styles.videoFeedCenter}>
              <View style={styles.doctorVideoAvatarBox}>
                <View style={styles.doctorVideoAvatar}>
                  <Text style={styles.doctorVideoAvatarText}>AV</Text>
                </View>
                <Text style={styles.doctorFeedTitle}>
                  {activeVideoCallBooking.agronomistName}
                </Text>
                <Text style={styles.doctorFeedSpeaking}>
                  Senior Crop Scientist is speaking...
                </Text>

                <View style={styles.doctorSpeechBubble}>
                  <Text style={styles.doctorSpeechText}>
                    "Namaste Param ji! I have reviewed your attached Tomato leaf scan and soil health
                    report. The upward cupping indicates Begomovirus transmitted by whiteflies.
                    Apply Imidacloprid and deploy yellow sticky traps on Friday morning after rain
                    passes."
                  </Text>
                </View>
              </View>

              {/* Farmer PiP */}
              <View style={styles.farmerPip}>
                <View style={styles.farmerPipAvatar}>
                  <Text style={styles.farmerPipAvatarText}>P</Text>
                </View>
                <Text style={styles.farmerPipName}>Param (You)</Text>
              </View>
            </View>

            {/* Bottom Controls */}
            <SafeAreaView style={styles.videoControlsSafe}>
              <View style={styles.videoControls}>
                <View style={styles.callControlCircle}>
                  <Phone size={20} color="#FFFFFF" />
                </View>
                <View style={styles.callControlCircle}>
                  <Video size={20} color="#FFFFFF" />
                </View>
                <View style={styles.callControlCircle}>
                  <MessageSquare size={20} color="#FFFFFF" />
                </View>
                <Pressable
                  style={styles.hangupCircle}
                  onPress={() => setActiveVideoCallBooking(null)}
                >
                  <PhoneOff size={24} color="#FFFFFF" />
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  headerActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  switcherPill: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  switcherBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  switcherBtnActive: {},
  switcherBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  switcherCountBadge: {
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  switcherCountText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  specialtyCarousel: {
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 4,
    marginBottom: 16,
  },
  specChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  specChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expertsList: {
    gap: 14,
  },
  expertCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  expertTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  expertLeft: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  expertName: {
    fontSize: 14,
    fontWeight: '800',
  },
  icarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 3,
  },
  icarBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  expertTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  expertMeta: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  ratingFeeCol: {
    alignItems: 'flex-end',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingNum: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  reviewCount: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  feeAmount: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 3,
  },
  feeSub: {
    fontSize: 8,
    fontFamily: 'monospace',
  },
  bioBox: {
    borderRadius: 14,
    padding: 10,
    marginTop: 12,
  },
  bioText: {
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 6,
  },
  languagesList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  langLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  langPill: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  langPillText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  bookCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  bookCallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  voiceCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 4,
  },
  voiceCallBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bookingsList: {
    gap: 14,
  },
  emptyBookingsBox: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  browseExpertsBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 8,
  },
  browseExpertsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bookingCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  bookingAgroName: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  bookingAgroTitle: {
    fontSize: 11,
  },
  paidBadge: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  bookingDetailsBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 11,
    fontWeight: '600',
  },
  caseAttachmentBox: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  caseAttachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  caseAttachmentTitle: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  caseAttachmentContent: {
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  joinRoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  joinRoomBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  bookingModalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsSmall: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingFormScroll: {
    marginTop: 14,
    marginBottom: 10,
  },
  autoAttachBanner: {
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  autoAttachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoAttachLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autoAttachTitle: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  attachedPill: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  caseSelectContainer: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
  },
  caseSelectText: {
    fontSize: 11,
    fontWeight: '700',
  },
  formSection: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    marginBottom: 6,
  },
  modeButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  modeBtnSelected: {},
  modeBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modeBtnTextSelected: {},
  dateButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dateBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateBtnSelected: {},
  dateBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateBtnTextSelected: {},
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  slotBtn: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  slotBtnSelected: {},
  slotBtnText: {
    fontSize: 10,
    fontWeight: '600',
  },
  slotBtnTextSelected: {},
  notesInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 10,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  feeSummaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  feeSummaryLabel: {
    fontSize: 8,
    fontFamily: 'monospace',
  },
  feeSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  feeSummaryAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalFooter: {
    paddingTop: 10,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
  },
  confirmBtnSuccess: {
    backgroundColor: '#15803D',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  videoRoomContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  videoHeaderSafe: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  videoDoctorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  livePulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  videoDoctorName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  videoDoctorSub: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#94A3B8',
  },
  endCallHeaderBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  endCallHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  videoFeedCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
  },
  doctorVideoAvatarBox: {
    alignItems: 'center',
    maxWidth: 320,
  },
  doctorVideoAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#047857',
    borderWidth: 4,
    borderColor: '#7CDE3D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  doctorVideoAvatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  doctorFeedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  doctorFeedSpeaking: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#7CDE3D',
    marginTop: 2,
    marginBottom: 14,
  },
  doctorSpeechBubble: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  doctorSpeechText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  farmerPip: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 90,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  farmerPipAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  farmerPipAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  farmerPipName: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#CBD5E1',
    fontWeight: '700',
  },
  videoControlsSafe: {
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  callControlCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hangupCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const AppointmentScreen = ExpertScreen;
