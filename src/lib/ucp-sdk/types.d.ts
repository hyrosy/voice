// src/lib/ucp-sdk/types.d.ts

declare module '@ucp/sdk' {
  import * as React from 'react';

  /**
   * The Universal Creator Platform (UCP) SDK.
   * Provides components and hooks to build dynamic, customizable marketplace themes.
   */
  export const UCP: {
    /** * A rich text element that allows end-users to edit content inline on the canvas. 
     * @example
     * <UCP.Text field="headline" default="Welcome!" className="text-2xl font-bold" />
     */
    Text: React.FC<{ 
      /** The unique key in your schema that this text binds to. */
      field: string; 
      /** The rendered text value. */
      value?: string; 
      /** The fallback text to display if the user hasn't typed anything yet. */
      default?: string; 
      /** The ID of the section used for inline editing state. */
      sectionId?: string; 
      /** Whether this text is rendering inside the preview canvas. */
      isPreview?: boolean; 
      /** Tailwind classes for styling. */
      className?: string; 
      /** The HTML tag to render (e.g., 'h1', 'p', 'span'). Defaults to 'span'. */
      as?: any; 
    }>;

    utils: {
      extractIframeSrc: (iframeString: string | undefined) => string;
      getGoogleMapsLink: (address: string, overrideUrl?: string) => string;
      getYoutubeId: (url: string | null | undefined) => string | null;
      isVideo: (url?: string | null) => boolean;
      cleanPhoneNumber: (num?: string | null) => string;
    };

    useScrollObserver: (threshold?: number) => { 
      isScrolled: boolean 
    };

    useCart: () => { 
      cartCount: number; 
      openCart: () => void 
    };

    useNavigationTree: (props: {
      data: any;
      allSections?: any[];
      theme?: any;
      isPreview?: boolean;
    }) => {
      menuTree: any[];
      handleNavClick: (item: any) => void;
    };

    useDeviceSize: (ref?: React.RefObject<HTMLElement>) => { 
      isMobile: boolean 
    };

    useGallery: (images?: any[], isPreview?: boolean) => {
      lightboxOpen: boolean;
      currentIndex: number;
      currentImage: any;
      carouselRef: React.RefObject<HTMLDivElement>;
      openLightbox: (index: number) => void;
      closeLightbox: () => void;
      nextImage: (e?: React.MouseEvent) => void;
      prevImage: (e?: React.MouseEvent) => void;
      scrollCarousel: (direction: "left" | "right") => void;
    };

    useCarousel: () => {
      carouselRef: React.RefObject<HTMLDivElement>;
      scrollCarousel: (direction: "left" | "right", scrollRatio?: number) => void;
    };

    useLeadForm: (props: {
      data: any;
      actorId?: string;
      portfolioId?: string;
      isPreview?: boolean;
    }) => {
      fields: any[];
      formState: Record<string, string>;
      setFormState: React.Dispatch<React.SetStateAction<Record<string, string>>>;
      isLoading: boolean;
      isSent: boolean;
      handleSubmit: (e: React.FormEvent) => Promise<void>;
      parseOptions: (optString?: string) => string[];
      resetForm: () => void;
    };

    usePricingForm: (props: {
      actorId?: string;
      portfolioId?: string;
      isPreview?: boolean;
    }) => {
      activePlan: any | null;
      formTemplate: any | null;
      isModalOpen: boolean;
      setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
      isLoadingForm: boolean;
      isSubmitting: boolean;
      isSuccess: boolean;
      formValues: Record<string, string>;
      setFormValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
      handlePlanAction: (plan: any, e: React.MouseEvent) => Promise<void>;
      handleFormSubmit: (e: React.FormEvent) => Promise<void>;
      parseOptions: (optString?: string) => string[];
    };

    useShopOrderForm: (props: {
      actorId?: string;
      portfolioId?: string;
      isPreview?: boolean;
      initialProduct?: any;
    }) => {
      selectedProduct: any | null;
      setSelectedProduct: React.Dispatch<React.SetStateAction<any | null>>;
      step: "details" | "form" | "success";
      setStep: React.Dispatch<React.SetStateAction<"details" | "form" | "success">>;
      formTemplate: any | null;
      setFormTemplate: React.Dispatch<React.SetStateAction<any | null>>;
      isModalOpen: boolean;
      setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
      isLoadingForm: boolean;
      setIsLoadingForm: React.Dispatch<React.SetStateAction<boolean>>;
      isSubmitting: boolean;
      setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
      isSuccess: boolean;
      setIsSuccess: React.Dispatch<React.SetStateAction<boolean>>;
      formValues: Record<string, string>;
      setFormValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
      selectedVariants: Record<string, any>;
      setSelectedVariants: React.Dispatch<React.SetStateAction<Record<string, any>>>;
      quantity: number;
      setQuantity: React.Dispatch<React.SetStateAction<number>>;
      expandedModalFaq: number | null;
      setExpandedModalFaq: React.Dispatch<React.SetStateAction<number | null>>;
      parseOptions: (optStringOrArray?: string | any[]) => string[];
      calculateTotalPrice: (basePrice: string, variants: Record<string, any>, qty: number) => string;
      openProductModal: (product: any) => void;
      proceedToCheckout: (product: any) => Promise<void>;
      handleFormSubmit: (e: React.FormEvent) => Promise<void>;
    };
  };
}