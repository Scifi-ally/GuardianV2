package com.guardian.safety.services;

import dagger.hilt.InstallIn;
import dagger.hilt.android.components.ServiceComponent;
import dagger.hilt.codegen.OriginatingElement;
import dagger.hilt.internal.GeneratedEntryPoint;

@OriginatingElement(
    topLevelClass = LocationTrackingService.class
)
@GeneratedEntryPoint
@InstallIn(ServiceComponent.class)
public interface LocationTrackingService_GeneratedInjector {
  void injectLocationTrackingService(LocationTrackingService locationTrackingService);
}
