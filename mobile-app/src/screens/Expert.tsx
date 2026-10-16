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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. Header with Eyebrow and 48px Circular Action */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>AGRONOMIST // MARKETPLACE [Demo Data]</Text>
            <Text style={styles.title}>Field Experts.</Text>
          </View>

          <Pressable
            style={styles.headerActionBtn}
            onPress={() => setActiveTab(activeTab === 'marketplace' ? 'my-bookings' : 'marketplace')}
          >
            <Calendar size={20} color={THEME.colors.primary} />
            {bookings.length > 0 && (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{bookings.length}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* 2. View Switcher Pill */}
        <View style={styles.switcherPill}>
          <Pressable
            style={[styles.switcherBtn, activeTab === 'marketplace' && styles.switcherBtnActive]}
            onPress={() => setActiveTab('marketplace')}
          >
            <Text
              style={[
                styles.switcherBtnText,
                activeTab === 'marketplace' && styles.switcherBtnTextActive,
              ]}
            >
              Find Expert
            </Text>
          </Pressable>

          <Pressable
            style={[styles.switcherBtn, activeTab === 'my-bookings' && styles.switcherBtnActive]}
            onPress={() => setActiveTab('my-bookings')}
          >
            <Text
              style={[
                styles.switcherBtnText,
                activeTab === 'my-bookings' && styles.switcherBtnTextActive,
              ]}
            >
              My Bookings
            </Text>
            {bookings.length > 0 && (
              <View
                style={[
                  styles.switcherCountBadge,
                  activeTab === 'my-bookings' && styles.switcherCountBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.switcherCountText,
                    activeTab === 'my-bookings' && styles.switcherCountTextActive,
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
                    style={[styles.specChip, isSelected && styles.specChipSelected]}
                    onPress={() => setSelectedSpecialty(spec)}
                  >
                    <Text style={[styles.specChipText, isSelected && styles.specChipTextSelected]}>
                      {spec}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Expert Cards */}
            <View style={styles.expertsList}>
              {filteredAgronomists.map((agronomist) => (
                <View key={agronomist.id} style={styles.expertCard}>
                  {/* Top Row: Avatar + Details + Rating/Fee */}
                  <View style={styles.expertTopRow}>
                    <View style={styles.expertLeft}>
                      <View
                        style={[
                          styles.avatarCircle,
                          { backgroundColor: agronomist.avatarBg || '#16882B' },
                        ]}
                      >
                        <Text style={styles.avatarInitials}>{agronomist.avatarInitials}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.nameRow}>
                          <Text style={styles.expertName}>{agronomist.name}</Text>
                          <View style={styles.icarBadge}>
                            <ShieldCheck size={11} color="#2E7D32" />
                            <Text style={styles.icarBadgeText}>ICAR</Text>
                          </View>
                        </View>

                        <Text style={styles.expertTitle}>{agronomist.title}</Text>
                        <Text style={styles.expertMeta}>
                          {agronomist.institution} • {agronomist.experienceYears} YRS EXP
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ratingFeeCol}>
                      <View style={styles.ratingRow}>
                        <Star size={12} color="#D97706" fill="#D97706" />
                        <Text style={styles.ratingNum}>{agronomist.rating}</Text>
                        <Text style={styles.reviewCount}>({agronomist.reviewCount})</Text>
                      </View>
                      <Text style={styles.feeAmount}>₹{agronomist.fee}</Text>
                      <Text style={styles.feeSub}>PER SESSION</Text>
                    </View>
                  </View>

                  {/* Bio quote */}
                  {agronomist.bio && (
                    <View style={styles.bioBox}>
                      <Text style={styles.bioText}>"{agronomist.bio}"</Text>
                    </View>
                  )}

                  {/* Languages & Next Slot */}
                  <View style={styles.metaRow}>
                    <View style={styles.languagesList}>
                      <Text style={styles.langLabel}>LANGUAGES:</Text>
                      {(agronomist.languages || ['Hindi', 'English']).map((lang) => (
                        <View key={lang} style={styles.langPill}>
                          <Text style={styles.langPillText}>{lang}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.slotRow}>
                      <Clock size={12} color="#2E7D32" />
                      <Text style={styles.slotText}>{agronomist.nextSlot}</Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    <Pressable
                      style={styles.bookCallBtn}
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
                      style={styles.voiceCallBtn}
                      onPress={() => {
                        setBookingAgronomist(agronomist);
                        setSelectedConsultationType('Voice Call');
                      }}
                    >
                      <Phone size={14} color="#334155" />
                      <Text style={styles.voiceCallBtnText}>Voice</Text>
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
              <View style={styles.emptyBookingsBox}>
                <Calendar size={36} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No active consultation bookings</Text>
                <Text style={styles.emptySub}>
                  Book a video consultation with verified ICAR agronomists anytime.
                </Text>
                <Pressable
                  style={styles.browseExpertsBtn}
                  onPress={() => setActiveTab('marketplace')}
                >
                  <Text style={styles.browseExpertsText}>Browse Experts</Text>
                </Pressable>
              </View>
            ) : (
              bookings.map((booking) => (
                <View key={booking.id} style={styles.bookingCard}>
                  <View style={styles.bookingCardHeader}>
                    <View>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>{booking.status}</Text>
                      </View>
                      <Text style={styles.bookingAgroName}>{booking.agronomistName}</Text>
                      <Text style={styles.bookingAgroTitle}>{booking.agronomistTitle}</Text>
                    </View>

                    <Text style={styles.paidBadge}>₹{booking.fee} PAID</Text>
                  </View>

                  <View style={styles.bookingDetailsBox}>
                    <View style={styles.detailItem}>
                      <Calendar size={13} color="#2E7D32" />
                      <Text style={styles.detailText}>{booking.date}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Clock size={13} color="#2E7D32" />
                      <Text style={styles.detailText}>{booking.timeSlot}</Text>
                    </View>
                    <View style={[styles.detailItem, { width: '100%', marginTop: 4 }]}>
                      <Video size={13} color="#2E7D32" />
                      <Text style={styles.detailText}>
                        Mode: {booking.type} • Plot: {booking.crop}
                      </Text>
                    </View>
                  </View>

                  {/* Auto-Attached Case History Display */}
                  {booking.notes && (
                    <View style={styles.caseAttachmentBox}>
                      <View style={styles.caseAttachmentHeader}>
                        <Paperclip size={12} color="#2E7D32" />
                        <Text style={styles.caseAttachmentTitle}>
                          AUTO-ATTACHED CASE HISTORY & SCAN REPORT
                        </Text>
                      </View>
                      <Text style={styles.caseAttachmentContent}>"{booking.notes}"</Text>
                    </View>
                  )}

                  {/* Join Consultation Room Button */}
                  <Pressable
                    style={styles.joinRoomBtn}
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
            <View style={styles.bookingModalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderInfo}>
                  <View
                    style={[
                      styles.avatarCircleSmall,
                      { backgroundColor: bookingAgronomist.avatarBg || '#16882B' },
                    ]}
                  >
                    <Text style={styles.avatarInitialsSmall}>
                      {bookingAgronomist.avatarInitials}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Book {bookingAgronomist.name}</Text>
                    <Text style={styles.modalSub}>
                      Fee: ₹{bookingAgronomist.fee} • {bookingAgronomist.institution}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={styles.modalCloseBtn}
                  onPress={() => setBookingAgronomist(null)}
                >
                  <X size={18} color="#475569" />
                </Pressable>
              </View>

              {/* Scrollable Form Content */}
              <ScrollView style={styles.bookingFormScroll} showsVerticalScrollIndicator={false}>
                {/* Auto-Attached Case History Banner */}
                <View style={styles.autoAttachBanner}>
                  <View style={styles.autoAttachHeader}>
                    <View style={styles.autoAttachLeft}>
                      <Paperclip size={13} color="#2E7D32" />
                      <Text style={styles.autoAttachTitle}>AUTO-ATTACHING CROP CASE HISTORY</Text>
                    </View>
                    <Text style={styles.attachedPill}>ATTACHED</Text>
                  </View>

                  <View style={styles.caseSelectContainer}>
                    <Text style={styles.caseSelectText}>
                      🌿 {selectedCropCase}
                    </Text>
                  </View>
                </View>

                {/* Consultation Mode */}
                <View style={styles.formSection}>
                  <Text style={styles.formLabel}>CONSULTATION MODE</Text>
                  <View style={styles.modeButtonsRow}>
                    {(['Video Call', 'Voice Call', 'In-Field Visit'] as const).map((type) => {
                      const isSelected = selectedConsultationType === type;
                      return (
                        <Pressable
                          key={type}
                          style={[styles.modeBtn, isSelected && styles.modeBtnSelected]}
                          onPress={() => setSelectedConsultationType(type)}
                        >
                          {type === 'Video Call' ? (
                            <Video size={16} color={isSelected ? '#FFFFFF' : '#475569'} />
                          ) : type === 'Voice Call' ? (
                            <Phone size={16} color={isSelected ? '#FFFFFF' : '#475569'} />
                          ) : (
                            <MapPin size={16} color={isSelected ? '#FFFFFF' : '#475569'} />
                          )}
                          <Text
                            style={[styles.modeBtnText, isSelected && styles.modeBtnTextSelected]}
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
                  <Text style={styles.formLabel}>SELECT DATE</Text>
                  <View style={styles.dateButtonsRow}>
                    {['Today, Oct 15', 'Tomorrow, Oct 16', 'Friday, Oct 17'].map((d) => {
                      const isSelected = selectedDate === d;
                      return (
                        <Pressable
                          key={d}
                          style={[styles.dateBtn, isSelected && styles.dateBtnSelected]}
                          onPress={() => setSelectedDate(d)}
                        >
                          <Text
                            style={[styles.dateBtnText, isSelected && styles.dateBtnTextSelected]}
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
                  <Text style={styles.formLabel}>AVAILABLE SLOTS</Text>
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
                          style={[styles.slotBtn, isSelected && styles.slotBtnSelected]}
                          onPress={() => setSelectedTimeSlot(slot)}
                        >
                          <Text
                            style={[styles.slotBtnText, isSelected && styles.slotBtnTextSelected]}
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
                  <Text style={styles.formLabel}>ADDITIONAL FARMER NOTES</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="e.g., Leaf curl symptoms in Block 3, need recommendation on spray..."
                    placeholderTextColor="#94A3B8"
                    value={farmerNotes}
                    onChangeText={setFarmerNotes}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* Summary Fee */}
                <View style={styles.feeSummaryBox}>
                  <View>
                    <Text style={styles.feeSummaryLabel}>TOTAL CONSULTATION FEE</Text>
                    <Text style={styles.feeSummaryTitle}>
                      Includes digital Rx & follow-up chat
                    </Text>
                  </View>
                  <Text style={styles.feeSummaryAmount}>₹{bookingAgronomist.fee}</Text>
                </View>
              </ScrollView>

              {/* Confirm Button */}
              <View style={styles.modalFooter}>
                <Pressable
                  style={[styles.confirmBtn, bookingSuccess && styles.confirmBtnSuccess]}
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
    backgroundColor: '#F7F9F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
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
    color: '#64748B',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1C18',
    marginTop: 2,
  },
  headerActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeCount: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2E7D32',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
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
  switcherBtnActive: {
    backgroundColor: '#2E7D32',
  },
  switcherBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  switcherBtnTextActive: {
    color: '#FFFFFF',
  },
  switcherCountBadge: {
    backgroundColor: '#2E7D32',
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  switcherCountBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  switcherCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  switcherCountTextActive: {
    color: '#2E7D32',
  },
  specialtyCarousel: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 16,
  },
  specChip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  specChipSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  specChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  specChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  expertsList: {
    gap: 14,
  },
  expertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
    color: '#1A1C18',
  },
  icarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 3,
  },
  icarBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#2E7D32',
  },
  expertTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 1,
  },
  expertMeta: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#94A3B8',
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
    color: '#94A3B8',
  },
  feeAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2E7D32',
    marginTop: 3,
  },
  feeSub: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#94A3B8',
  },
  bioBox: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 14,
    padding: 10,
    marginTop: 12,
  },
  bioText: {
    fontSize: 11,
    color: '#475569',
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
    color: '#94A3B8',
  },
  langPill: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  langPillText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#2E7D32',
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
    color: '#2E7D32',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  bookCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 4,
  },
  voiceCallBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  bookingsList: {
    gap: 14,
  },
  emptyBookingsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  browseExpertsBtn: {
    backgroundColor: '#2E7D32',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    gap: 12,
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusPill: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#2E7D32',
  },
  bookingAgroName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1C18',
    marginTop: 6,
  },
  bookingAgroTitle: {
    fontSize: 11,
    color: '#64748B',
  },
  paidBadge: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#2E7D32',
  },
  bookingDetailsBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0,0,0,0.02)',
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
    color: '#334155',
  },
  caseAttachmentBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 14,
    padding: 12,
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
    color: '#2E7D32',
  },
  caseAttachmentContent: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  joinRoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
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
    backgroundColor: '#FFFFFF',
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
    color: '#1A1C18',
  },
  modalSub: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingFormScroll: {
    marginTop: 14,
    marginBottom: 10,
  },
  autoAttachBanner: {
    backgroundColor: '#E8F5E9',
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
    color: '#2E7D32',
  },
  attachedPill: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#2E7D32',
  },
  caseSelectContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  caseSelectText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1C18',
  },
  formSection: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#64748B',
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
    borderColor: 'rgba(0,0,0,0.08)',
    gap: 4,
  },
  modeBtnSelected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  modeBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  modeBtnTextSelected: {
    color: '#FFFFFF',
  },
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
    borderColor: 'rgba(0,0,0,0.08)',
  },
  dateBtnSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  dateBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  dateBtnTextSelected: {
    color: '#2E7D32',
  },
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
    borderColor: 'rgba(0,0,0,0.08)',
  },
  slotBtnSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  slotBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  slotBtnTextSelected: {
    color: '#2E7D32',
    fontWeight: '800',
  },
  notesInput: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 14,
    padding: 10,
    fontSize: 12,
    color: '#1A1C18',
    textAlignVertical: 'top',
  },
  feeSummaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  feeSummaryLabel: {
    fontSize: 8,
    fontFamily: 'monospace',
    color: '#64748B',
  },
  feeSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1C18',
    marginTop: 2,
  },
  feeSummaryAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E7D32',
  },
  modalFooter: {
    paddingTop: 10,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
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
