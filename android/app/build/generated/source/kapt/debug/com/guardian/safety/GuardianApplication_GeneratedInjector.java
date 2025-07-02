package com.guardian.safety;

import dagger.hilt.InstallIn;
import dagger.hilt.codegen.OriginatingElement;
import dagger.hilt.components.SingletonComponent;
import dagger.hilt.internal.GeneratedEntryPoint;

@OriginatingElement(
    topLevelClass = GuardianApplication.class
)
@GeneratedEntryPoint
@InstallIn(SingletonComponent.class)
public interface GuardianApplication_GeneratedInjector {
  void injectGuardianApplication(GuardianApplication guardianApplication);
}
